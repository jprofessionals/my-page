package no.jpro.mypageapi.integration.notificationjob

import no.jpro.mypageapi.entity.Status
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.NotificationRepository
import no.jpro.mypageapi.repository.NotificationTaskRepository
import no.jpro.mypageapi.repository.SubscriptionRepository
import no.jpro.mypageapi.testutil.EntityFactory
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

class GenerateNotificationsJobTest(
    @Autowired var jobPostingRepository: JobPostingRepository,
    @Autowired var notificationTaskRepository: NotificationTaskRepository,
    @Autowired var notificationRepository: NotificationRepository,
    @Autowired var subscriptionRepository: SubscriptionRepository,
    @Autowired var entityFactory: EntityFactory
)  : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        jobPostingRepository.deleteAll() // Only deleting from parent table to test cascading delete
        subscriptionRepository.deleteAll()
    }

    @Test
    fun startNotificationJob_empty() {
        sendValidRequest()
    }

    @Test
    fun startNotificationJob_one_task_one_tag() {
        val jobPosting = entityFactory.createJobPosting(tags = listOf("tag_to_use"))
        entityFactory.createSubscription(userId = 1, tags = listOf("tag_to_use", "noise"))
        entityFactory.createSubscription(userId = 2, tags = listOf("noise"))

        sendValidRequest()

        assertThat(notificationRepository.findAll()).hasSize(1)

        val persisted = notificationRepository.findByUserIdAndJobPostingId(1, jobPosting.id)
        assertThat(persisted!!.status).isEqualTo(Status.CREATED)

        assertThat(notificationTaskRepository.findAll()).hasSize(1)
        assertThat(notificationTaskRepository.findByStatus(Status.SENT)).hasSize(1)
    }

    @Test
    fun startNotificationJob_two_tasks_one_tag() {
        val jobPosting = entityFactory.createJobPosting(tags = listOf("tag_to_use"))
        val jobPosting2 = entityFactory.createJobPosting(tags = listOf("tag_to_use"))
        entityFactory.createSubscription(userId = 1, tags = listOf("tag_to_use", "noise"))
        entityFactory.createSubscription(userId = 2, tags = listOf("tag_to_use", "noise"))

        sendValidRequest()

        assertThat(notificationRepository.findAll()).hasSize(4)
        assertThat(notificationRepository.findByUserIdAndJobPostingId(1, jobPosting.id)).isNotNull
        assertThat(notificationRepository.findByUserIdAndJobPostingId(1, jobPosting2.id)).isNotNull
        assertThat(notificationRepository.findByUserIdAndJobPostingId(2, jobPosting.id)).isNotNull
        assertThat(notificationRepository.findByUserIdAndJobPostingId(2, jobPosting2.id)).isNotNull

        assertThat(notificationTaskRepository.findAll()).hasSize(2)
        assertThat(notificationTaskRepository.findByStatus(Status.SENT)).hasSize(2)
    }

    @Test
    fun startNotificationJob_two_tasks_two_tags() {
        val jobPosting = entityFactory.createJobPosting(tags = listOf("tag_to_use", "another_tag_to_use"))
        val jobPosting2 = entityFactory.createJobPosting(tags = listOf("tag_to_use", "another_tag_to_use"))
        entityFactory.createSubscription(userId = 1, tags = listOf("tag_to_use", "another_tag_to_use"))
        entityFactory.createSubscription(userId = 2, tags = listOf("tag_to_use", "another_tag_to_use"))

        sendValidRequest()

        assertThat(notificationRepository.findAll()).hasSize(4)
        assertThat(notificationRepository.findByUserIdAndJobPostingId(1, jobPosting.id)).isNotNull
        assertThat(notificationRepository.findByUserIdAndJobPostingId(1, jobPosting2.id)).isNotNull
        assertThat(notificationRepository.findByUserIdAndJobPostingId(2, jobPosting.id)).isNotNull
        assertThat(notificationRepository.findByUserIdAndJobPostingId(2, jobPosting2.id)).isNotNull

        assertThat(notificationTaskRepository.findAll()).hasSize(2)
        assertThat(notificationTaskRepository.findByStatus(Status.SENT)).hasSize(2)
    }

    @Test
    fun multiple_tags_make_one_notification() {
        val jobPosting = entityFactory.createJobPosting(tags = listOf("tag_to_use", "another_tag_to_use"))
        entityFactory.createSubscription(userId = 1, tags = listOf("tag_to_use", "noise"))
        entityFactory.createSubscription(userId = 1, tags = listOf("another_tag_to_use"))

        sendValidRequest()

        assertThat(notificationRepository.findAll()).hasSize(1)

        val persisted = notificationRepository.findByUserIdAndJobPostingId(1, jobPosting.id)
        assertThat(persisted!!.status).isEqualTo(Status.CREATED)

        assertThat(notificationTaskRepository.findAll()).hasSize(1)
        assertThat(notificationTaskRepository.findByStatus(Status.SENT)).hasSize(1)
    }

    @Test
    fun startNotificationJob_earlier_failed_run() {
        val jobPosting = entityFactory.createJobPosting(tags = listOf("tag_to_use"))
        entityFactory.createSubscription(userId = 1, tags = listOf("tag_to_use"))
        entityFactory.createSubscription(userId = 1, tags = listOf("noise"))
        entityFactory.createSubscription(userId = 2, tags = listOf("tag_to_use"))

        entityFactory.createNotification(userId = 1, jobPosting = jobPosting)

        assertThat(notificationRepository.findAll()).hasSize(1)

        sendValidRequest()

        assertThat(notificationRepository.findAll()).hasSize(2)
        assertThat(notificationRepository.findByUserIdAndJobPostingId(1, jobPosting.id)).isNotNull
        assertThat(notificationRepository.findByUserIdAndJobPostingId(2, jobPosting.id)).isNotNull

        assertThat(notificationTaskRepository.findAll()).hasSize(1)
        assertThat(notificationTaskRepository.findByStatus(Status.SENT)).hasSize(1)
    }

    @Test
    fun startNotificationJob_no_header() {
        val response = restClient(false)
            .getForEntity<Void>(uri = "/job/generate-notifications")
        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

    private fun sendValidRequest(): ResponseEntity<Void> {
        val response = restClient(false)
            .add("X-Appengine-Cron") { "true" }
            .getForEntity<Void>(uri = "/job/generate-notifications")
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        return response
    }

}
