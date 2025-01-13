package no.jpro.mypageapi.contoller


import no.jpro.mypageapi.dto.UserDTO
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class UserContollerTest()  : IntegrationTestBase() {

    @Test
    fun contextLoads() {}


    @Test
    fun fetchUser() {
        val response = restClient(true).getForEntity<List<UserDTO>>("/user")
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun fetchUserAgain() {
        val response = restClient(false).getForEntity<List<UserDTO>>("/user")
        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

}