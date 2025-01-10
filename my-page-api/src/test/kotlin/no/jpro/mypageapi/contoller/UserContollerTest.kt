package no.jpro.mypageapi.contoller

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.testutil.HttpHeaderTestRestTemplate
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class UserContollerTest(@Autowired val httpHeaderTestRestTemplate: HttpHeaderTestRestTemplate)  : BaseIntegrationTest() {

    @Test
    fun contextLoads() {}


    @Test
    fun fetchUser() {
        val response = httpHeaderTestRestTemplate.getForEntity<List<UserDTO>>("/user")
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
    }

}