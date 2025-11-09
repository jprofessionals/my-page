package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.SubscriptionApiDelegate
import no.jpro.mypageapi.model.Subscription
import no.jpro.mypageapi.service.SubscriptionService
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.AuthenticationHelper
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class SubscriptionApiDelegateImpl(
    private val userService: UserService,
    private val subscriptionService: SubscriptionService,
    private val authHelper: AuthenticationHelper,
    private val request: Optional<NativeWebRequest>
) : SubscriptionApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun createSubscription(tag: String, testUserID: String?): ResponseEntity<String> {
        // Get testUserId from request header (OpenAPI generator uses exact header name from spec)
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)

        // Get user from authentication or test header
        val user = authHelper.getCurrentUser(testUserId)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        // Create subscription
        subscriptionService.createSubscription(tag, user)

        return ResponseEntity("A new subscription has been successfully created", HttpStatus.CREATED)
    }

    override fun deleteSubscription(tag: String, testUserID: String?): ResponseEntity<String> {
        // Get testUserId from request header (OpenAPI generator uses exact header name from spec)
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)

        // Get user from authentication or test header
        val user = authHelper.getCurrentUser(testUserId)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        // Delete subscription
        subscriptionService.deleteSubscription(tag, user)

        // Note: Original controller returns 201 CREATED for delete, keeping same behavior
        return ResponseEntity("A new subscription has been successfully created", HttpStatus.CREATED)
    }

    override fun listSubscriptions(testUserID: String?): ResponseEntity<List<Subscription>> {
        // Get testUserId from request header (OpenAPI generator uses exact header name from spec)
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)

        // Get user from authentication or test header
        val user = authHelper.getCurrentUser(testUserId)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        // Get subscriptions and map to OpenAPI model
        val subscriptionDTOs = subscriptionService.listSubscriptions(user.id!!)
        val subscriptions = subscriptionDTOs.map { Subscription(tag = it.tag) }

        return ResponseEntity.ok(subscriptions)
    }
}