package no.jpro.mypageapi

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import jakarta.mail.Session
import jakarta.mail.internet.MimeMessage
import no.jpro.mypageapi.config.GptConversationServiceMock
import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.service.ChatGPTEmailService
import no.jpro.mypageapi.service.ai.GptConversationService
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.jwt.JwtDecoder
import java.io.BufferedInputStream


@SpringBootTest
@AutoConfigureMockMvc
@Import(MockApplicationConfig::class)
class MyPageApiApplicationTests @Autowired constructor(private val chatGPTEmailService: ChatGPTEmailService,
		                                               private val gptConversationService: GptConversationService) {

	@MockBean
	lateinit var jwtDecoder: JwtDecoder

	@MockBean
	lateinit var credentialsProvider: CredentialsProvider

	@MockBean
	lateinit var gcpProjectIdProvider: GcpProjectIdProvider

	@Test
	fun contextLoads() {
	}

	@Test
	fun chatGPTEmail() {
		if (gptConversationService is GptConversationServiceMock) {
			gptConversationService.setMockResponses(listOf("""
				[
				  {
					"kunde": "Statnett",
					"rolle": "senior utvikler",
					"antallStillinger": 3,
					"arbeidssted": "Nydalen",
					"totaltAntallÅrsErfaring": 0,
					"søknadsfrist": "2023-06-02T10:00:00Z",
					"systemEllerProsjekt": "Fosweb",
					"teknologier": [
					  ".Net"
					]
				  }
				]
			""".trimIndent()))
		}

		val message = MimeMessage(Session.getDefaultInstance(System.getProperties()),
				                  BufferedInputStream(this::class.java.getResourceAsStream("/email1.rfc822")))

		val parts = chatGPTEmailService.parsePartRecursive(message)
		val result = chatGPTEmailService.chatGPTJobPosting(parts)

		Assertions.assertTrue(result.isNotEmpty())
	}
}
