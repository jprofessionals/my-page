package no.jpro.mypageapi.integration


import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.testutil.EntityFactory
import no.jpro.mypageapi.testutil.HttpHeaderTestRestTemplate
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
abstract class IntegrationTestBase {

    @Autowired
    private lateinit var entityFactory: EntityFactory

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var testRestTemplate: TestRestTemplate

    var mockOAuth2Server = MockOAuth2Server()

    lateinit var user: User
    lateinit var adminUser: User


    @BeforeEach
    fun baseSetup() {
        mockOAuth2Server = MockOAuth2Server()
        mockOAuth2Server.start(8099)

        userRepository.deleteAll()
        user = entityFactory.createUser(email = "test@test.no", employeeNumber = 12345)
        adminUser = entityFactory.createUser(email = "admin_test@test.no", employeeNumber = 12346, isAdmin = true)
    }

    @AfterEach
    fun baseShutdown() {mockOAuth2Server.shutdown()}

    fun restClient(authenticated: Boolean): HttpHeaderTestRestTemplate {
        val client = HttpHeaderTestRestTemplate(testRestTemplate)
        if (authenticated) {
            client.add(HttpHeaders.AUTHORIZATION) { generateBearerToken() }
        }

        return client
    }

    fun restClient(authenticated: Boolean, asAdmin: Boolean): HttpHeaderTestRestTemplate {
        val client = HttpHeaderTestRestTemplate(testRestTemplate)
        if (authenticated) {
            if (asAdmin) {
                client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", adminUser.id.toString())
            } else {
                client.add(HttpHeaders.AUTHORIZATION) { generateBearerToken() }
            }
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