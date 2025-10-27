package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.BookingService
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.PendingBookingService
import no.jpro.mypageapi.service.UserService
import org.springframework.core.env.Environment
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("me")
@SecurityRequirement(name = "Bearer Authentication")
class MeController(
    private val userService: UserService,
    private val budgetService: BudgetService,
    private val bookingService: BookingService,
    private val pendingBookingService: PendingBookingService,
    private val userRepository: UserRepository,
    private val environment: Environment
) {

    @GetMapping
    @Transactional
    @Operation(summary = "Get data for user identified by the bearer token")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserDTO::class))]
    )
    fun getCurrentLoggedInUser(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt?,
        @RequestHeader("X-Test-User-Id", required = false) testUserId: String?
    ): UserDTO? {
        // In development mode, support test user header
        if (isDevelopmentProfile()) {
            val testUser = getTestUserById(testUserId)
            if (testUser != null) {
                return UserDTO(
                    name = testUser.name,
                    email = testUser.email,
                    icon = testUser.icon,
                    givenName = testUser.givenName,
                    familyName = testUser.familyName,
                    admin = testUser.admin,
                    budgets = null
                )
            }
        }

        // For local development without authentication and no test user, return null
        if (jwt == null) {
            return null
        }
        return userService.getOrCreateUser(jwt).apply { this.budgets = null }
    }

    // Check if we're running in a development profile (local or h2)
    private fun isDevelopmentProfile(): Boolean {
        return environment.activeProfiles.any { it == "local" || it == "h2" }
    }

    // For local development - get user by ID from header
    private fun getTestUserById(testUserId: String?): no.jpro.mypageapi.entity.User? {
        if (testUserId == null) return null
        return try {
            userRepository.findById(testUserId.toLong()).orElse(null)
        } catch (e: NumberFormatException) {
            null
        }
    }

    @GetMapping("budgets")
    @Transactional
    @Operation(summary = "Get the different budgets that belong to logged in user.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BudgetDTO::class)
            )
        )]
    )
    fun getBudgets(token: JwtAuthenticationToken): List<BudgetDTO> {
        return budgetService.getBudgets(token.getSub())
    }

    @GetMapping("bookings")
    @Transactional
    @Operation(summary = "Get the different cabin bookings that belong to logged in user.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BookingDTO::class)
            )
        )]
    )
    fun getBookings(token: JwtAuthenticationToken): List<BookingDTO> {
        return bookingService.getUserBookings(token.getSub())
    }
    @GetMapping("pendingBookings")
    @Transactional
    @Operation(summary = "Get the different cabin pending bookings that belong to logged in user.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = PendingBookingDTO::class)
            )
        )]
    )
    fun getPendingBookings(token: JwtAuthenticationToken): List<PendingBookingDTO> {
        return pendingBookingService.getUserPendingBookings(token.getSub())
    }
}
