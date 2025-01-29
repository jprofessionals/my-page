package no.jpro.mypageapi.integration.subscription

import no.jpro.mypageapi.dto.SubscriptionDTO
import no.jpro.mypageapi.entity.Subscription
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.SubscriptionRepository
import org.assertj.core.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

private const val ENDPOINT_URL = "/subscription"

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
            .getForEntity<List<SubscriptionDTO>>(uri = "$ENDPOINT_URL/list")
        Assertions.assertThat(response.statusCode).isEqualTo(HttpStatus.OK)

        Assertions.assertThat(response.body).hasSize(2)
        Assertions.assertThat(response.body?.get(0)?.tag).isEqualTo("another")
        Assertions.assertThat(response.body?.get(1)?.tag).isEqualTo("tag")

    }

    @Test
    fun subscribe_not_authenticated() {
        val response = restClient(false)
            .postForEntity<Void>(uri = "$ENDPOINT_URL/tag")
        Assertions.assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

}