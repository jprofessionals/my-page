package no.jpro.mypageapi

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import no.jpro.mypageapi.config.MockApplicationConfig
import org.junit.jupiter.api.Test
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.jwt.JwtDecoder


@SpringBootTest
@AutoConfigureMockMvc
@Import(MockApplicationConfig::class)
class MyPageApiApplicationTests {

	@MockBean
	lateinit var jwtDecoder: JwtDecoder

	@MockBean
	lateinit var credentialsProvider: CredentialsProvider

	@MockBean
	lateinit var gcpProjectIdProvider: GcpProjectIdProvider

	@Test
	fun contextLoads() {
	}

}
