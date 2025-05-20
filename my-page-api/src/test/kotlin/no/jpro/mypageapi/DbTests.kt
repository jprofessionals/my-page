package no.jpro.mypageapi

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.DbUtils
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.bean.override.mockito.MockitoBean


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(MockApplicationConfig::class)
class DbTests @Autowired constructor(private val apartmentRepository: ApartmentRepository, private val dbUtils: DbUtils) {

	@MockitoBean
	lateinit var jwtDecoder: JwtDecoder

	@MockitoBean
	lateinit var credentialsProvider: CredentialsProvider

	@MockitoBean
	lateinit var gcpProjectIdProvider: GcpProjectIdProvider


	@Test
	fun testTransaction() {
		var existingCount = apartmentRepository.count()
		try {
			dbUtils.failOutsideTransaction(apartmentRepository)
		} catch(e: Exception) {
			Assertions.assertEquals("Transaction is false", e.message)
		}
		Assertions.assertNotEquals(existingCount, apartmentRepository.count()) //Transaction should not have been rolled back

		existingCount = apartmentRepository.count()
		try {
			dbUtils.failInsideTransaction(apartmentRepository)
		} catch(e: Exception) {
			Assertions.assertEquals("Transaction is true", e.message)
		}
		Assertions.assertEquals(existingCount, apartmentRepository.count()) //Transaction should have been rolled back
	}
}
