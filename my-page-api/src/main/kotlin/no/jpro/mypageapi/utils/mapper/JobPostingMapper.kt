package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.JobPostingDTO
import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.service.ChatGPTResponse
import org.slf4j.LoggerFactory
import java.time.LocalDate
import java.time.format.DateTimeFormatter

object JobPostingMapper {

    val logger = LoggerFactory.getLogger(this::class.java)

    fun toJobPostingDTO(jobPosting: JobPosting): JobPostingDTO {
        return JobPostingDTO(
            id = jobPosting.id,
            title = jobPosting.title,
            description = jobPosting.description,
            customer = jobPosting.customer,
            tags = jobPosting.tags.map { it.name },
            location = jobPosting.location,
            dueDateForApplication = jobPosting.dueDateForApplication,
            requiredYearsOfExperience = jobPosting.requiredYearsOfExperience,
            resourcesNeeded = jobPosting.resourcesNeeded
        )
    }

    fun toJobPosting(
        subject: String,
        chatGPTResponse: ChatGPTResponse,
        contentDigest: String,
        messageId: String
    ): JobPosting {
        val dueDate = attemptToParseStupidAIResponse(chatGPTResponse.søknadsfrist)
        return JobPosting(
            customer = chatGPTResponse.kunde,
            description = subject,
            dueDateForApplication = dueDate,
            location = chatGPTResponse.arbeidssted,
            resourcesNeeded = chatGPTResponse.antallStillinger,
            requiredYearsOfExperience = chatGPTResponse.totaltAntallÅrsErfaring,
            title = "${chatGPTResponse.rolle} ${chatGPTResponse.systemEllerProsjekt}",
            contentDigest = contentDigest,
            messageId = messageId,
        )
    }

    private fun attemptToParseStupidAIResponse(søknadsfrist: String): LocalDate? {
        if (søknadsfrist.isBlank()) {
            return null
        }
        return try {
            DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(appendZIfMissing(søknadsfrist), LocalDate::from)
        } catch (e: Exception) {
            null
        }
    }

    private fun appendZIfMissing(søknadsfrist: String): String {
        return if (søknadsfrist.endsWith("Z")) {
            søknadsfrist
        } else {
            logger.info("ChatGPT violated ISO8601")
            søknadsfrist.plus("Z")
        }
    }

}
