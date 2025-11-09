package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import no.jpro.mypageapi.dto.SubscriptionDTO
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.SubscriptionService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Legacy SubscriptionController - MIGRATED to OpenAPI
 * This controller has been replaced by SubscriptionApiDelegateImpl
 * @see SubscriptionApiDelegateImpl
 */
// @RestController - DISABLED: Migrated to OpenAPI delegate pattern
// @RequestMapping("subscription")
@Tag(
    name = "Subscription",
    description = "Lets users subscribe to tags"
)
@SecurityRequirement(name = "Bearer Authentication")
class SubscriptionController(
    private val userService: UserService,
    private val subscriptionService: SubscriptionService,
) {

    @PostMapping("/{tag}")
    @Operation(summary = "Create a new subscription")
    @ApiResponse(
        responseCode = "201",
        description = "New subscription created"
    )
    fun subscribe(
        token: JwtAuthenticationToken,
        @PathVariable tag: String,
    ): ResponseEntity<String> {
        val user = userService.getValidUserBySub(token.getSub())
        subscriptionService.createSubscription(tag, user)
        return ResponseEntity("A new subscription has been successfully created", HttpStatus.CREATED)
    }

    @GetMapping("/list")
    @Operation(summary = "Get all subscriptions for the requesting User")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = SubscriptionDTO::class)
            )
        )]
    )
    fun list(
        token: JwtAuthenticationToken,
    ): ResponseEntity<List<SubscriptionDTO>> {
        val user = userService.getValidUserBySub(token.getSub())
        return ResponseEntity.ok(subscriptionService.listSubscriptions(user.id!!))
    }

    @DeleteMapping("/{tag}")
    @Operation(summary = "Delete a subscription")
    @ApiResponse(
        responseCode = "201",
        description = "Subscription deleted"
    )
    fun delete(
        token: JwtAuthenticationToken,
        @PathVariable tag: String,
    ): ResponseEntity<String> {
        val user = userService.getValidUserBySub(token.getSub())
        subscriptionService.deleteSubscription(tag, user)
        return ResponseEntity("A new subscription has been successfully created", HttpStatus.CREATED)
    }
}
