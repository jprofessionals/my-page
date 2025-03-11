package no.jpro.mypageapi.integration.notificationjob

import no.jpro.mypageapi.entity.Status
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.*
import no.jpro.mypageapi.testutil.EntityFactory
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

class SendNotificationJobTest(
    @Autowired var jobPostingRepository: JobPostingRepository,
    @Autowired var notificationRepository: NotificationRepository,
    @Autowired var subscriptionRepository: SubscriptionRepository,
    @Autowired var entityFactory: EntityFactory
)  : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        jobPostingRepository.deleteAll() // Only deleting from parent table to test cascading delete
        subscriptionRepository.deleteAll()
        notificationRepository.deleteAll()
    }

    @Test
    fun startNotificationJob_empty() {
        sendValidRequest()
    }

    @Test
    fun startNotificationJob_unsent_notification() {
        val jobPosting = entityFactory.createJobPosting(tags = listOf("tag_to_use"))
        entityFactory.createNotification(userId = user.id, jobPosting = jobPosting)
        assertThat(notificationRepository.findAll()).hasSize(1)
        assertThat(notificationRepository.findByStatus(Status.CREATED)).hasSize(1)
        sendValidRequest()
        assertThat(notificationRepository.findByStatus(Status.SENT)).hasSize(1)
    }


    @Test
    fun startNotificationJob_no_header() {
        val response = restClient(true)
            .getForEntity<Void>(uri = "/job/send-notifications")
        assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
    }

    private fun sendValidRequest(): ResponseEntity<Void> {
        val response = restClient(false)
            .add("X-Appengine-Cron") { "true" }
            .getForEntity<Void>(uri = "/job/send-notifications")
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        return response
    }

}