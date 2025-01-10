package no.jpro.mypageapi.config

import no.jpro.mypageapi.testutil.HttpHeaderTestRestTemplate
import no.nav.security.mock.oauth2.MockOAuth2Server
import no.nav.security.mock.oauth2.token.DefaultOAuth2TokenCallback
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpHeaders

@TestConfiguration
class TestRestTemplateConfiguration {

    @Autowired
    private lateinit var mockOAuth2Server: MockOAuth2Server


    @Bean
    fun httpHeaderTestRestTemplate(testRestTemplate: TestRestTemplate): HttpHeaderTestRestTemplate {
        val httpHeaderTestRestTemplate = HttpHeaderTestRestTemplate(testRestTemplate)
        httpHeaderTestRestTemplate.add(HttpHeaders.AUTHORIZATION) { generateBearerToken() }
        return httpHeaderTestRestTemplate
    }


    private fun generateBearerToken(): String {
        val token =
            mockOAuth2Server.issueToken(
                "default",
                "test",
                DefaultOAuth2TokenCallback(subject = "12345"),
            )
        return "Bearer " + token.serialize()
    }
}