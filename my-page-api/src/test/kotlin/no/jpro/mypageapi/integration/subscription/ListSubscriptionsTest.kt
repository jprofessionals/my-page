package no.jpro.mypageapi.integration.subscription

import no.jpro.mypageapi.dto.SubscriptionDTO
import no.jpro.mypageapi.entity.Subscription
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.SubscriptionRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

private const val ENDPOINT_URL = "/subscription/list"

class ListSubscriptionsTest(
    @Autowired var subscriptionRepository: SubscriptionRepository
)  : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        subscriptionRepository.deleteAll()
    }

    @Test
    fun list() {
        subscriptionRepository.save(Subscription(userId = user.id!!, tag = "tag"))
        subscriptionRepository.save(Subscription(userId = user.id!!, tag = "another"))
        subscriptionRepository.save(Subscription(userId = 5, tag = "unseen"))

        val response = restClient(true)
            .getForEntity<List<SubscriptionDTO>>(ENDPOINT_URL)
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(response.body).hasSize(2)
        assertThat(response.body?.get(0)?.tag).isEqualTo("another")
        assertThat(response.body?.get(1)?.tag).isEqualTo("tag")
    }

    @Test
    fun empty_list() {
        val response = restClient(true)
            .getForEntity<List<SubscriptionDTO>>(ENDPOINT_URL)
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(response.body).hasSize(0)
    }


    @Test
    fun subscribe_not_authenticated() {
        val response = restClient(false)
            .postForEntity<Void>(ENDPOINT_URL)
        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

}