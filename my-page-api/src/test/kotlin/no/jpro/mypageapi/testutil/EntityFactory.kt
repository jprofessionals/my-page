package no.jpro.mypageapi.testutil

import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.Notification
import no.jpro.mypageapi.entity.Subscription
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.NotificationRepository
import no.jpro.mypageapi.repository.NotificationTaskRepository
import no.jpro.mypageapi.repository.SubscriptionRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.JobPostingService
import org.springframework.stereotype.Component

@Component
class EntityFactory(
    private val jobPostingService: JobPostingService,
    private val subscriptionRepository: SubscriptionRepository,
    private val notificationRepository: NotificationRepository,
    private val notificationTaskRepository: NotificationTaskRepository,
    private val userRepository: UserRepository,
    private val modelFactory: ModelFactory
) {

    fun createJobPosting(tags: List<String>): JobPosting {
        return jobPostingService.createJobPosting(
            notify = true,
            jobPosting = modelFactory.createJobPosting(tags = tags)
        )
    }

    fun createUser(email: String, employeeNumber: Int, isAdmin: Boolean = false): User {
        return userRepository.save(
            User(
                email = email,
                employeeNumber = employeeNumber,
                sub = employeeNumber.toString(),
                budgets = listOf(),
                familyName = null,
                givenName = null,
                name = null,
                admin = true
            )
        )
    }

    fun createSubscription(userId: Long, tags: List<String>) {
        tags.forEach { tag ->
            subscriptionRepository.save(Subscription(userId = userId, tag = tag))
        }
    }

    fun createNotification(userId: Long, jobPosting: JobPosting) {
        val notificationTask = notificationTaskRepository.findByJobPostingId(jobPosting.id)
        notificationRepository.save(
            Notification(userId = userId, jobPostingId = jobPosting.id, notificationTaskId = notificationTask.id)
        )
    }
}