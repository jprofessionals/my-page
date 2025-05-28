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
import no.jpro.mypageapi.service.BookingService
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.PendingBookingService
import no.jpro.mypageapi.service.UserService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("me")
@SecurityRequirement(name = "Bearer Authentication")
class MeController(
    private val userService: UserService,
    private val budgetService: BudgetService,
    private val bookingService: BookingService,
    private val pendingBookingService: PendingBookingService
) {

    @GetMapping
    @Transactional
    @Operation(summary = "Get data for user identified by the bearer token")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserDTO::class))]
    )
    fun getCurrentLoggedInUser(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): UserDTO =
        userService.getOrCreateUser(jwt).apply { this.budgets = null }

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
