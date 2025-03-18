package no.jpro.mypageapi.job

import no.jpro.mypageapi.entity.Notification
import no.jpro.mypageapi.entity.NotificationTask
import no.jpro.mypageapi.entity.Status
import no.jpro.mypageapi.repository.*
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
    private val userRepository: UserRepository,
)  {

    fun fetchAvailableSets(): List<NotificationTask> {
        return notificationTaskRepository.findByStatusIn(listOf(Status.CREATED, Status.FAILED))
    }

    fun fetchAvailableNotifications(): List<Notification> {
        return notificationRepository.findByStatusIn(listOf(Status.CREATED, Status.FAILED))
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun setStatus(it: NotificationTask, status: Status) {
        it.status = status
        notificationTaskRepository.save(it)
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun setStatus(it: Notification, status: Status) {
        it.status = status
        notificationRepository.save(it)
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun createNotifications(notificationTask: NotificationTask) {
        val tags = jobPostingRepository.getReferenceById(notificationTask.jobPostingId)
            .tags
            .map { it.name }

        val subscriptions = subscriptionRepository.findAllByTagIn(tags).map { it.userId }
        val users = userRepository.findByJobNotifications(true).mapNotNull { it.id }

        val distinctUserIds = (subscriptions + users).toSet()
        distinctUserIds.forEach {
            notificationRepository.findByUserIdAndJobPostingId(it, notificationTask.jobPostingId)
                ?:
                notificationRepository.save(
                    Notification(
                        notificationTaskId = notificationTask.id,
                        userId = it,
                        jobPostingId = notificationTask.jobPostingId
                    )
                )
        }
    }

    fun sendNotification(notification: Notification) {
        val user = userRepository.findById(notification.userId).orElseThrow()
        val jobPosting = jobPostingRepository.findById(notification.jobPostingId).orElseThrow()
        emailService.sendSimpleMessage(requireNotNull(user.email) { "Null is not allowed" },
            "Utlysning: ${jobPosting.title}",
            """
                Hei ${user.name},
                Det er en ny utlysning som kan være av interesse for deg:
                <p>
                    <a href='https://minside.jpro.no/utlysninger?id=${jobPosting.id}'>${jobPosting.title}</a><br>
                    <b>Kunde:</b> ${jobPosting.customer.name} <b>Frist:</b> ${jobPosting.deadline}<br>
                    <b>Tagger:</b> ${jobPosting.tags.map { it.name }.joinToString(", ")}
                </p>
            """
        )

    }
}