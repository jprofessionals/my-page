package no.jpro.mypageapi

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.repository.DbUtils
import no.jpro.mypageapi.repository.JobPostingRepository
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.jwt.JwtDecoder


@SpringBootTest
@AutoConfigureMockMvc
@Import(MockApplicationConfig::class)
class DbTests @Autowired constructor(private val jobPostingRepository: JobPostingRepository,
									 private val dbUtils: DbUtils) {

	@MockBean
	lateinit var jwtDecoder: JwtDecoder

	@MockBean
	lateinit var credentialsProvider: CredentialsProvider

	@MockBean
	lateinit var gcpProjectIdProvider: GcpProjectIdProvider


	@Test
	fun testTransaction() {
		var existingCount = jobPostingRepository.count()
		try {
			dbUtils.failOutsideTransaction(jobPostingRepository)
		} catch(e: Exception) {
			Assertions.assertEquals("Transaction is false", e.message)
		}
		Assertions.assertNotEquals(existingCount, jobPostingRepository.count()) //Transaction should not have been rolled back

		existingCount = jobPostingRepository.count()
		try {
			dbUtils.failInsideTransaction(jobPostingRepository)
		} catch(e: Exception) {
			Assertions.assertEquals("Transaction is true", e.message)
		}
		Assertions.assertEquals(existingCount, jobPostingRepository.count()) //Transaction should have been rolled back
	}
}
