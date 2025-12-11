package no.jpro.mypageapi.job

import no.jpro.mypageapi.service.SlackNotificationService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
class CabinBookingNotificationJob(
    private val slackNotificationService: SlackNotificationService
) {
    private val logger = LoggerFactory.getLogger(CabinBookingNotificationJob::class.java)

    /**
     * Runs every Tuesday at 09:00 to notify Slack about upcoming cabin bookings
     */
    @Scheduled(cron = "0 0 9 * * TUE")
    fun notifyUpcomingCabinBookings() {
        logger.info("Running scheduled cabin booking notification...")
        try {
            val result = slackNotificationService.notifySlackChannelWithUpcomingBookings()
            logger.info("Cabin booking notification sent: $result")
        } catch (e: Exception) {
            logger.error("Failed to send cabin booking notification", e)
        }
    }
}
