package no.jpro.mypageapi.job

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class NotificationJob(private val notificationJobService: NotificationJobService) {

    @Value("\${job.enabled:true}")
    private var enabled: Boolean = true


    fun triggerJob () {
        if (enabled) {
            run()
        }
    }

    fun run () {
        notificationJobService.fetchAvailableSets().forEach {
            notificationJobService.setInProgress(it)
            notificationJobService.createNotifications(it)
        }
    }
}