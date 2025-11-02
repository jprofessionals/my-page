package no.jpro.mypageapi.job

import no.jpro.mypageapi.entity.Status
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class NotificationJob(private val notificationJobService: NotificationJobService) {

    private val logger = LoggerFactory.getLogger(NotificationJobService::class.java.name)

    @Value("\${notification.jobs.enabled}")
    private var enabled: Boolean = true

    @Transactional
    fun triggerNotificationGenerationJob () {
        if (enabled) {
            runNotificationGeneration()
        }
    }

    fun triggerNotificationSendingJob () {
        if (enabled) {
            runNotificationSending()
        }
    }

    private fun runNotificationGeneration () {
        notificationJobService.fetchAvailableSets().forEach {
            notificationJobService.setStatus(it, Status.IN_PROGRESS)

            try {
                notificationJobService.createNotifications(it)
                notificationJobService.setStatus(it, Status.SENT)
            } catch (e: Exception) {
                logger.error("Failed to create notifications for notificationTask: $it", e)
                notificationJobService.setStatus(it, Status.FAILED)
            }
        }
    }

    private fun runNotificationSending() {
        notificationJobService.sendNotifications()
    }
}