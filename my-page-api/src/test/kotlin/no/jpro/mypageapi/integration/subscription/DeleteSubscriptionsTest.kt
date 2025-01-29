package no.jpro.mypageapi.integration.subscription

import no.jpro.mypageapi.entity.Subscription
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.SubscriptionRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

private const val ENDPOINT_URL = "/subscription"

class DeleteSubscriptionsTest(
    @Autowired var subscriptionRepository: SubscriptionRepository
)  : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        subscriptionRepository.deleteAll()
    }

    @Test
    fun delete() {
        subscriptionRepository.save(Subscription(userId = user.id!!, tag = "tag"))
        subscriptionRepository.save(Subscription(userId = user.id!!, tag = "another"))
        subscriptionRepository.save(Subscription(userId = 5, tag = "tag"))

        val response = restClient(true)
            .delete<Void>(uri = "$ENDPOINT_URL/tag")
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)

        assertThat(subscriptionRepository.findAll()).hasSize(2)
        assertThat(subscriptionRepository.findByUserIdAndTag(user.id, "another")).isNotNull
        assertThat(subscriptionRepository.findByUserIdAndTag(5, "tag")).isNotNull
    }


    @Test
    fun subscribe_not_authenticated() {
        val response = restClient(false)
            .postForEntity<Void>(uri = "$ENDPOINT_URL/tag")
        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

}