package no.jpro.mypageapi.contoller


import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.testutil.HttpHeaderTestRestTemplate
import no.jpro.mypageapi.testutil.TestUserService
import no.nav.security.mock.oauth2.MockOAuth2Server
import no.nav.security.mock.oauth2.token.DefaultOAuth2TokenCallback
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.http.HttpHeaders
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
abstract class IntegrationTestBase (){

    @Autowired
    private lateinit var userService: TestUserService

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var testRestTemplate: TestRestTemplate

    var mockOAuth2Server = MockOAuth2Server()


    @BeforeEach
    fun setup() {
        mockOAuth2Server = MockOAuth2Server()
        mockOAuth2Server.start(8099)

        userRepository.deleteAll()
        userService.adminUser("test@test.no", 12345)
    }

    @AfterEach
    fun shutdown() {mockOAuth2Server.shutdown()}

    fun restClient(authenticated: Boolean): HttpHeaderTestRestTemplate {
        val client = HttpHeaderTestRestTemplate(testRestTemplate)
        if (authenticated) {
            client.add(HttpHeaders.AUTHORIZATION) { generateBearerToken() }
        }

        return client
    }

    fun generateBearerToken(): String {
        val token =
            mockOAuth2Server.issueToken(
                "default",
                "test",
                DefaultOAuth2TokenCallback(subject = "12345"),
            )
        return "Bearer " + token.serialize()
    }
}