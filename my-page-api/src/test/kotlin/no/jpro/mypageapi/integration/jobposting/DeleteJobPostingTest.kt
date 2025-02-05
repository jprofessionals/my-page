package no.jpro.mypageapi.integration.jobposting

import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.NotificationTaskRepository
import no.jpro.mypageapi.testutil.EntityFactory
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

private const val ENDPOINT_URL = "/job-postings"

class DeleteJobPostingTest(
    @Autowired var jobPostingRepository: JobPostingRepository,
    @Autowired var notificationTaskRepository: NotificationTaskRepository,
    @Autowired var entityFactory: EntityFactory
)  : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        jobPostingRepository.deleteAll()
        notificationTaskRepository.deleteAll()
    }

    @Test
    fun delete() {
        val jobPosting = entityFactory.createJobPosting(tags = listOf("tag1"))

        assertThat(jobPostingRepository.findAll()).hasSize(1)
        assertThat(notificationTaskRepository.findAll()).hasSize(1)

        val response = restClient(true)
            .delete<Void>(uri = "$ENDPOINT_URL/${jobPosting.id}")
        assertThat(response.statusCode).isEqualTo(HttpStatus.NO_CONTENT)

        assertThat(jobPostingRepository.findAll()).hasSize(0)
        assertThat(notificationTaskRepository.findAll()).hasSize(0)
    }

    @Test
    fun delete_not_authenticated() {
        val response = restClient(false)
            .delete<Void>(uri = "$ENDPOINT_URL/88")
        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

}