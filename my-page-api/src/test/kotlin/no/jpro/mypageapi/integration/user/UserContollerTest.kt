package no.jpro.mypageapi.integration.user


import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.integration.IntegrationTestBase
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