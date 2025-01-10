package no.jpro.mypageapi.contoller


import no.jpro.mypageapi.config.TestRestTemplateConfiguration
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.testutil.TestUserService
import no.nav.security.token.support.spring.test.EnableMockOAuth2Server
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TestRestTemplateConfiguration::class)
@EnableMockOAuth2Server(port = 8099)
abstract class BaseIntegrationTest (){

    @Autowired
    private lateinit var userService: TestUserService

    @Autowired
    private lateinit var userRepository: UserRepository

    @BeforeEach
    fun setup() {
        userRepository.deleteAll()
        userService.adminUser("test@test.no", 12345)
    }

}