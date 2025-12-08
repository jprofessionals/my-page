package no.jpro.mypageapi.job

import no.jpro.mypageapi.repository.SalesActivityRepository
import no.jpro.mypageapi.service.slack.SlackService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@Service
class SalesPipelineDeadlineJob(
    private val salesActivityRepository: SalesActivityRepository,
    private val slackService: SlackService
) {
    private val logger = LoggerFactory.getLogger(SalesPipelineDeadlineJob::class.java)
    private val dateTimeFormatter = DateTimeFormatter.ofPattern("d. MMMM yyyy 'kl.' HH:mm", Locale.forLanguageTag("no-NO"))

    /**
     * Runs every day at 08:00 to check for offer deadlines within the next 24 hours
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    fun checkUpcomingDeadlines() {
        logger.info("Checking for upcoming offer deadlines...")

        val now = LocalDateTime.now()
        val in24Hours = now.plusHours(24)
        val activitiesWithDeadline = salesActivityRepository.findActivitiesWithUpcomingDeadline(now, in24Hours)

        if (activitiesWithDeadline.isEmpty()) {
            logger.info("No activities with upcoming deadlines found")
            return
        }

        logger.info("Found ${activitiesWithDeadline.size} activities with deadline within next 24 hours")

        for (activity in activitiesWithDeadline) {
            val consultantName = activity.consultant.name ?: "Ukjent konsulent"
            val customerDisplay = activity.customerName ?: activity.customer?.name ?: "Ukjent kunde"
            val supplierInfo = activity.supplierName?.let { " (via $it)" } ?: ""
            val deadlineFormatted = activity.offerDeadline?.format(dateTimeFormatter) ?: "ukjent dato"

            val message = buildString {
                append(":warning: *Tilbudsfrist snart!*\n\n")
                append("*Konsulent:* $consultantName\n")
                append("*Kunde:* $customerDisplay$supplierInfo\n")
                append("*Tittel:* ${activity.title}\n")
                append("*Frist:* $deadlineFormatted\n")
                if (activity.offeredPrice != null) {
                    append("*Tilbudt pris:* ${activity.offeredPrice} kr/t\n")
                }
                append("\n<https://minside.jpro.no/salgstavle|Se salgstavlen>")
            }

            try {
                slackService.postMessageToSalesPipelineChannel(message)
                activity.deadlineReminderSent = true
                salesActivityRepository.save(activity)
                logger.info("Sent deadline reminder for activity ${activity.id}: ${activity.title}")
            } catch (e: Exception) {
                logger.error("Failed to send deadline reminder for activity ${activity.id}", e)
            }
        }
    }
}
