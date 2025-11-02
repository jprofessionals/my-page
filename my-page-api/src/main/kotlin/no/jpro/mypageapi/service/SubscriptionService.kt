package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.SubscriptionDTO
import no.jpro.mypageapi.entity.Subscription
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.SubscriptionRepository
import no.jpro.mypageapi.utils.mapper.SubscriptionMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SubscriptionService(
    private val subscriptionRepository: SubscriptionRepository,
    private val subscriptionMapper: SubscriptionMapper,
) {
    fun createSubscription(tag: String, user: User) {
        val userId = requireNotNull(user.id) { "User ID must not be null" }
        subscriptionRepository.findByUserIdAndTag(userId, tag)
            ?: subscriptionRepository.save(Subscription(userId = userId, tag = tag))
    }

    fun listSubscriptions(userId: Long): List<SubscriptionDTO> {
        val subscriptions = subscriptionRepository.findByUserIdOrderByTag(userId)
        return subscriptions.map { subscriptionMapper.toSubscriptionDTO(it)}
    }

    @Transactional
    fun deleteSubscription(tag: String, user: User) {
        assert(user.id != null) { "User ID must not be null" }
        subscriptionRepository.deleteByUserIdAndTag(userId = user.id!!, tag = tag)
    }
}