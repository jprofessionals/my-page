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
import org.springframework.transaction.annotation.Propagation
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

        // Log total count for comparison
        val allCount = jobPostingRepository.count()
        logger.info("Total job postings in database: $allCount")

        val uncategorized = jobPostingRepository.findByTechCategoryIsNull()
        logger.info("Found ${uncategorized.size} uncategorized job postings (from findByTechCategoryIsNull)")

        // Also verify with in-memory count
        val allPostings = jobPostingRepository.findAll()
        val nullCategoryCount = allPostings.count { it.techCategory == null }
        logger.info("In-memory null category count: $nullCategoryCount (from findAll + filter)")

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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun resetAllCategories(): Int {
        val allJobPostings = jobPostingRepository.findAll()
        logger.info("Resetting tech categories for ${allJobPostings.size} job postings")
        allJobPostings.forEach { it.techCategory = null }
        jobPostingRepository.saveAll(allJobPostings)
        return allJobPostings.size
    }

    fun recategorizeAll(): Map<String, Any> {
        if (isRunning.get()) {
            return mapOf(
                "isRunning" to true,
                "started" to false,
                "message" to "Kategorisering pågår allerede",
                "progress" to progress.get(),
                "total" to total
            )
        }

        // Reset all tech categories first
        val count = resetAllCategories()
        logger.info("Reset $count job postings, now starting categorization")

        if (count == 0) {
            return mapOf(
                "isRunning" to false,
                "started" to false,
                "message" to "Ingen utlysninger funnet",
                "progress" to 0,
                "total" to 0
            )
        }

        // Use startCategorization which properly handles @Async
        return startCategorization()
    }

    @Async
    fun categorizeAsync(uncategorized: List<JobPosting>) {
        isRunning.set(true)
        logger.info("=== STARTING CATEGORIZATION OF ${uncategorized.size} JOB POSTINGS ===")

        var successCount = 0
        var failCount = 0
        val failedIds = mutableListOf<Long>()

        try {
            for (jobPosting in uncategorized) {
                try {
                    val category = categorizeJobPosting(jobPosting)
                    saveCategory(jobPosting.id, category)
                    successCount++
                    progress.incrementAndGet()
                    // Only log every 10th to reduce noise
                    if (progress.get() % 10 == 0) {
                        logger.info("Progress: ${progress.get()}/$total (success: $successCount, failed: $failCount)")
                    }
                    // Small delay to avoid rate limiting
                    Thread.sleep(100)
                } catch (e: Exception) {
                    logger.warn("Failed job posting ${jobPosting.id}, retrying once...")
                    // Retry once after a short delay
                    try {
                        Thread.sleep(2000)
                        val category = categorizeJobPosting(jobPosting)
                        saveCategory(jobPosting.id, category)
                        successCount++
                        logger.info("Retry succeeded for job posting ${jobPosting.id}")
                    } catch (retryException: Exception) {
                        failCount++
                        failedIds.add(jobPosting.id)
                        logger.error("Failed to categorize job posting ${jobPosting.id} after retry: ${retryException.message}")
                    }
                    progress.incrementAndGet()
                }
            }
        } finally {
            isRunning.set(false)
            logger.info("=== CATEGORIZATION COMPLETE ===")
            logger.info("Total: $total, Success: $successCount, Failed: $failCount")
            if (failedIds.isNotEmpty()) {
                logger.info("Failed job posting IDs: $failedIds")
            }
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

            - JAVA_KOTLIN: Backend-utvikling med Java og/eller Kotlin (også kun Kotlin uten Java). Inkluderer: Spring Boot, JVM-basert utvikling, Kafka, PostgreSQL/SQL-databaser med Java/Kotlin. Backend-utvikler roller som krever Kotlin er JAVA_KOTLIN. Merk: Kotlin til Android/mobilutvikling hører IKKE her.
            - DOTNET: Backend-utvikling med .NET, C#, ASP.NET, eller Microsoft-teknologier. Inkluderer fullstack med .NET backend.
            - DATA_ANALYTICS: Data engineering, dataanalyse, BI, datavitenskap, ETL, datawarehousing, Power BI, machine learning.
            - FRONTEND: KUN ren frontend/web-utvikling med React, Angular, Vue, JavaScript/TypeScript. Ingen backend-arbeid. React Native (mobil) hører IKKE her.
            - OTHER: Alt som ikke passer over: mobilutvikling (React Native, Flutter, iOS, Android), Python/Node backend, DevOps uten spesifikk backend, arkitektur, testing, prosjektledelse.

            Viktige regler:
            - Backend-utvikler med Kotlin → JAVA_KOTLIN (selv uten Java nevnt)
            - Backend med Kafka + Kotlin/Java → JAVA_KOTLIN
            - Fullstack med Java/Kotlin backend → JAVA_KOTLIN
            - Fullstack med .NET backend → DOTNET
            - Fullstack med Python/Node backend → OTHER
            - Ren frontend uten backend → FRONTEND

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
