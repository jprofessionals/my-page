package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.provider.SecretProvider
import no.jpro.mypageapi.service.BookingLotteryService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("task")
@SecurityRequirement(name = "Bearer Authentication")
class TaskController(val bookingLotteryService: BookingLotteryService, val secretProvider: SecretProvider) {

    @GetMapping("/drawPendingBookings")
    @Operation(summary = "Draws winning pending bookings that have been active for more than 7 days")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json")]
    )
    fun triggerDrawPendingBookings(@RequestHeader("auth-key") authKey: String): ResponseEntity<String> {
        if (authKey != secretProvider.getBookingLotteryKey()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
        bookingLotteryService.runPendingBookingsLottery()
        return ResponseEntity.ok("Pending bookings have been drawn")
    }
}