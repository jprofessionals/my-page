package no.jpro.mypageapi

import org.junit.jupiter.api.Test
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.security.oauth2.jwt.JwtDecoder


@SpringBootTest
@AutoConfigureMockMvc
class MyPageApiApplicationTests {

	@MockBean
	lateinit var jwtDecoder: JwtDecoder

	@Test
	fun contextLoads() {
	}

}
