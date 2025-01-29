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

class CreateSubscriptionTest(
    @Autowired var subscriptionRepository: SubscriptionRepository
)  : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        subscriptionRepository.deleteAll()
    }

    @Test
    fun subscribe() {
        val response = restClient(true)
            .postForEntity<Void>(uri = "$ENDPOINT_URL/tag")
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)

        assertThat(subscriptionRepository.findAll()).hasSize(1)
        assertThat(subscriptionRepository.findByUserIdOrderByTag(user.id)).hasSize(1)
        assertThat(subscriptionRepository.findByUserIdAndTag(user.id, "tag")).isNotNull
    }

    @Test
    fun subscribeMultiple() {
        var response = restClient(true)
            .postForEntity<Void>(uri = "$ENDPOINT_URL/BBB")
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)

        response = restClient(true)
            .postForEntity<Void>(uri = "$ENDPOINT_URL/AAA")
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)

        assertThat(subscriptionRepository.findAll()).hasSize(2)
        assertThat(subscriptionRepository.findByUserIdOrderByTag(user.id)).hasSize(2)
        assertThat(subscriptionRepository.findByUserIdAndTag(user.id, "BBB")).isNotNull
        assertThat(subscriptionRepository.findByUserIdAndTag(user.id, "AAA")).isNotNull
    }

    @Test
    fun subscribes_are_idempotent() {
        subscriptionRepository.save(Subscription(userId = user.id!!, tag = "tag"))

        val response = restClient(true)
            .postForEntity<Void>(uri = "$ENDPOINT_URL/tag")
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)

        assertThat(subscriptionRepository.findAll()).hasSize(1)
        assertThat(subscriptionRepository.findByUserIdOrderByTag(user.id)).hasSize(1)
        assertThat(subscriptionRepository.findByUserIdAndTag(user.id, "tag")).isNotNull
    }

    @Test
    fun subscribe_not_authenticated() {
        val response = restClient(false)
            .postForEntity<Void>(uri = "$ENDPOINT_URL/tag")
        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

}