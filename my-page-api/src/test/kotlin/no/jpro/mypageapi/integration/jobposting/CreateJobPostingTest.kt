package no.jpro.mypageapi.integration.jobposting

import no.jpro.mypageapi.entity.Status
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.NotificationTaskRepository
import no.jpro.mypageapi.testutil.ModelFactory
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus


private const val ENDPOINT_URL = "/job-postings"

class CreateJobPostingTest(
    @Autowired var jobPostingRepository: JobPostingRepository,
    @Autowired var notificationTaskRepository: NotificationTaskRepository,
    @Autowired var modelFactory: ModelFactory,
)  : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        jobPostingRepository.deleteAll()
        notificationTaskRepository.deleteAll()
    }

    @Test
    fun create() {
        val response = restClient(authenticated = true, asAdmin = true)
            .postForEntity<JobPosting>(uri = ENDPOINT_URL, modelFactory.createJobPosting(tags = listOf("tag1")))
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(jobPostingRepository.findAll()).hasSize(1)

        assertThat(notificationTaskRepository.findAll()).hasSize(1)
        val notificationTask = notificationTaskRepository.findAll().get(0)
        assertThat(notificationTask.jobPostingId).isEqualTo(jobPostingRepository.findAll().get(0).id)
        assertThat(notificationTask.status).isEqualTo(Status.CREATED)
    }


    @Test
    fun subscribe_not_authenticated() {
        val response = restClient(false)
            .postForEntity<JobPosting>(uri = ENDPOINT_URL, modelFactory.createJobPosting(tags = listOf("tag1")))
        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

}