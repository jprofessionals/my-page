package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.SubscriptionApiDelegate
import no.jpro.mypageapi.model.Subscription as SubscriptionModel
import no.jpro.mypageapi.service.SubscriptionService
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.extensions.getSub
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class SubscriptionApiDelegateImpl(
    private val subscriptionService: SubscriptionService,
    private val userService: UserService,
    private val request: Optional<NativeWebRequest>
) : SubscriptionApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun createSubscription(tag: String): ResponseEntity<String> {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication !is JwtAuthenticationToken) {
            return ResponseEntity.status(401).body("Unauthorized")
        }

        val user = userService.getValidUserBySub(authentication.getSub())
        subscriptionService.createSubscription(tag, user)
        return ResponseEntity("A new subscription has been successfully created", HttpStatus.CREATED)
    }

    override fun deleteSubscription(tag: String): ResponseEntity<String> {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication !is JwtAuthenticationToken) {
            return ResponseEntity.status(401).body("Unauthorized")
        }

        val user = userService.getValidUserBySub(authentication.getSub())
        subscriptionService.deleteSubscription(tag, user)
        return ResponseEntity("Subscription deleted", HttpStatus.OK)
    }

    override fun listSubscriptions(): ResponseEntity<List<SubscriptionModel>> {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication !is JwtAuthenticationToken) {
            return ResponseEntity.status(401).build()
        }

        val user = userService.getValidUserBySub(authentication.getSub())
        val subscriptions = subscriptionService.listSubscriptions(user.id!!)
        val subscriptionModels = subscriptions.map { SubscriptionModel(tag = it.tag) }
        return ResponseEntity.ok(subscriptionModels)
    }
}