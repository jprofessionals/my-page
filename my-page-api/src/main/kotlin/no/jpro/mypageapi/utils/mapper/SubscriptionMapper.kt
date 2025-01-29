package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.SubscriptionDTO
import no.jpro.mypageapi.entity.Subscription
import org.springframework.stereotype.Service

@Service
class SubscriptionMapper {

    fun toSubscriptionDTO(subscription: Subscription): SubscriptionDTO = SubscriptionDTO(
        tag = subscription.tag,
    )

}
