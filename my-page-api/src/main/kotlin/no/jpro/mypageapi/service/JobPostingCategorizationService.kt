package no.jpro.mypageapi.service

import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import no.jpro.mypageapi.consumer.ai.GPT_4o
import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.TechCategory
import no.jpro.mypageapi.repository.JobPostingRepository
import org.jsoup.Jsoup
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

@Service
class JobPostingCategorizationService(
    private val jobPostingRepository: JobPostingRepository,
    private val openAIConsumer: OpenAIConsumer
) {
    private val logger = LoggerFactory.getLogger(JobPostingCategorizationService::class.java)

    private val isRunning = AtomicBoolean(false)
    private val progress = AtomicInteger(0)
    private var total = 0

    fun getStatus(): Map<String, Any> {
        return mapOf(
            "isRunning" to isRunning.get(),
            "progress" to progress.get(),
            "total" to total
        )
    }

    fun startCategorization(): Map<String, Any> {
        if (isRunning.get()) {
            return mapOf(
                "isRunning" to true,
                "started" to false,
                "message" to "Kategorisering pågår allerede",
                "progress" to progress.get(),
                "total" to total
            )
        }

        val uncategorized = jobPostingRepository.findByTechCategoryIsNull()
        total = uncategorized.size
        progress.set(0)

        if (total == 0) {
            return mapOf(
                "isRunning" to false,
                "started" to false,
                "message" to "Ingen ukategoriserte utlysninger funnet",
                "progress" to 0,
                "total" to 0
            )
        }

        // Start async categorization
        categorizeAsync(uncategorized)

        return mapOf(
            "isRunning" to true,
            "started" to true,
            "message" to "Startet kategorisering av $total utlysninger",
            "progress" to 0,
            "total" to total
        )
    }

    @Async
    fun categorizeAsync(uncategorized: List<JobPosting>) {
        isRunning.set(true)
        logger.info("Starting async categorization of ${uncategorized.size} job postings")

        try {
            for (jobPosting in uncategorized) {
                try {
                    val category = categorizeJobPosting(jobPosting)
                    saveCategory(jobPosting.id, category)
                    progress.incrementAndGet()
                    logger.info("Categorized job posting ${jobPosting.id} as $category (${progress.get()}/$total)")
                } catch (e: Exception) {
                    logger.error("Failed to categorize job posting ${jobPosting.id}: ${e.message}")
                    progress.incrementAndGet() // Still count as processed
                }
            }
        } finally {
            isRunning.set(false)
            logger.info("Finished categorization. Processed ${progress.get()} of $total")
        }
    }

    @Transactional
    fun saveCategory(jobPostingId: Long, category: TechCategory) {
        val jobPosting = jobPostingRepository.findById(jobPostingId).orElse(null) ?: return
        jobPosting.techCategory = category
        jobPostingRepository.save(jobPosting)
    }

    @Transactional
    fun categorizeAllUncategorized(): Int {
        val uncategorized = jobPostingRepository.findByTechCategoryIsNull()
        logger.info("Found ${uncategorized.size} uncategorized job postings")

        var categorizedCount = 0
        for (jobPosting in uncategorized) {
            try {
                val category = categorizeJobPosting(jobPosting)
                jobPosting.techCategory = category
                jobPostingRepository.save(jobPosting)
                categorizedCount++
                logger.info("Categorized job posting ${jobPosting.id} as $category")
            } catch (e: Exception) {
                logger.error("Failed to categorize job posting ${jobPosting.id}: ${e.message}")
            }
        }

        return categorizedCount
    }

    @Transactional
    fun categorizeJobPosting(jobPosting: JobPosting): TechCategory {
        val plainDescription = jobPosting.description?.let {
            Jsoup.parse(it).text()
        } ?: ""

        val prompt = """
            Kategoriser denne utlysningen i EN av følgende kategorier basert på tittel og beskrivelse:

            - JAVA_KOTLIN: Utlysninger som primært handler om Java, Kotlin, Spring Boot, eller JVM-basert utvikling
            - DOTNET: Utlysninger som primært handler om .NET, C#, ASP.NET, eller Microsoft-basert backend-utvikling
            - DATA_ANALYTICS: Utlysninger som primært handler om data engineering, dataanalyse, BI, datavitenskap, ETL, datawarehousing, Power BI, machine learning
            - FRONTEND: Utlysninger som primært handler om frontend-utvikling, React, Angular, Vue, JavaScript/TypeScript UI-arbeid
            - OTHER: Utlysninger som ikke passer i noen av de andre kategoriene (DevOps, arkitektur, testing, prosjektledelse, etc.)

            Tittel: ${jobPosting.title}

            Beskrivelse: ${plainDescription.take(2000)}

            Svar KUN med navnet på kategorien (JAVA_KOTLIN, DOTNET, DATA_ANALYTICS, FRONTEND, eller OTHER), ingen annen tekst.
        """.trimIndent()

        val messages = listOf(
            ChatMessage(
                role = ChatRole.System,
                content = "Du er en ekspert på å kategorisere IT-utlysninger. Svar alltid med nøyaktig én kategori."
            ),
            ChatMessage(
                role = ChatRole.User,
                content = prompt
            )
        )

        val response = openAIConsumer.chatCompletion(GPT_4o, messages)
        val categoryText = response.choices.firstOrNull()?.message?.content?.trim()?.uppercase() ?: "OTHER"

        return try {
            TechCategory.valueOf(categoryText)
        } catch (e: IllegalArgumentException) {
            logger.warn("Unknown category '$categoryText' for job posting ${jobPosting.id}, defaulting to OTHER")
            TechCategory.OTHER
        }
    }
}
