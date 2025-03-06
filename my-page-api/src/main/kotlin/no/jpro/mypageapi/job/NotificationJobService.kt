package no.jpro.mypageapi.job

import no.jpro.mypageapi.entity.Notification
import no.jpro.mypageapi.entity.NotificationTask
import no.jpro.mypageapi.entity.Status
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.NotificationRepository
import no.jpro.mypageapi.repository.NotificationTaskRepository
import no.jpro.mypageapi.repository.SubscriptionRepository
import no.jpro.mypageapi.service.email.EmailService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class NotificationJobService(
    private val emailService: EmailService,
    private val notificationTaskRepository: NotificationTaskRepository,
    private val notificationRepository: NotificationRepository,
    private val jobPostingRepository: JobPostingRepository,
    private val subscriptionRepository: SubscriptionRepository,
)  {

    fun fetchAvailableSets(): List<NotificationTask> {
        return notificationTaskRepository.findByStatusIn(listOf(Status.CREATED, Status.FAILED))
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun setStatus(it: NotificationTask, status: Status) {
        it.status = status
        notificationTaskRepository.save(it)
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun createNotifications(notificationTask: NotificationTask) {
        val tags = jobPostingRepository.getReferenceById(notificationTask.jobPostingId)
            .tags
            .map { it.name }
        val users = subscriptionRepository.findAllByTagIn(tags).distinctBy { it.userId }
        users.forEach {
            notificationRepository.findByUserIdAndJobPostingId(it.userId, notificationTask.jobPostingId)
                ?:
                notificationRepository.save(
                    Notification(
                        notificationTaskId = notificationTask.id,
                        userId = it.userId,
                        jobPostingId = notificationTask.jobPostingId
                    )
                )
        }
    }

    fun sendNotifications() {
        emailService.sendMail()
    }
}