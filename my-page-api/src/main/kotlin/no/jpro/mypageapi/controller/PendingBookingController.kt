package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.PendingBookingService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.format.DateTimeParseException

@RestController
@RequestMapping("pendingBooking")
@SecurityRequirement(name = "Bearer Authentication")
class PendingBookingController(
    private val pendingBookingService: PendingBookingService,
    private val userService: UserService,
) {

    @PostMapping("/pendingPost")
    @Transactional
    @Operation(summary = "Create a new pending booking")
    @ApiResponse(
        responseCode = "201",
        description = "New booking created",
        content = [Content(schema = Schema(implementation = BookingDTO::class))]
    )
    fun createPendingBooking(
        token: JwtAuthenticationToken,
        @Valid @RequestBody bookingRequest: CreatePendingBookingDTO,
    ): ResponseEntity<String> {
        val user =
            userService.getUserBySub(token.getSub()) ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        try {
            pendingBookingService.createPendingBooking(bookingRequest, user)
            return ResponseEntity.ok("A new booking has been successfully created")
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().body(e.message)
        }
    }

    @GetMapping("/pendingBookingInformation")
    @Transactional
    @Operation(summary = "Get the pending booking trains and the corresponding drawing periods")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = PendingBookingTrainDTO::class)
            )
        )]
    )
    fun getPendingBookingInformation(
        token: JwtAuthenticationToken,
    ): List<List<PendingBookingTrainDTO>> {
        try {
            return pendingBookingService.getPendingBookingInformation()
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @PostMapping("/pendingBookingWin")
    @Transactional
    @Operation(summary = "Pending booking becomes a booking")
    @ApiResponse(
        responseCode = "201",
        description = "New booking created",
        content = [Content(schema = Schema(implementation = BookingDTO::class))]
    )
    fun pickWinnerPendingBooking(
        token: JwtAuthenticationToken,
        @Valid @RequestBody pendingBookingList: List<PendingBookingDTO>,
    ): ResponseEntity<String> {
        try {
            pendingBookingService.pickWinnerPendingBooking(pendingBookingList)
            return ResponseEntity.ok("A new booking has been successfully created")
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().body(e.message)
        }
    }

    @DeleteMapping("{pendingBookingID}")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Delete the pending booking connected to the pending booking id")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json")]
    )
    fun deletePendingBooking(
        token: JwtAuthenticationToken,
        @PathVariable("pendingBookingID") pendingBookingID: Long,
    ): ResponseEntity<String> {
        val pendingBooking = pendingBookingService.getPendingBooking(pendingBookingID)
        if (pendingBooking === null){
            return ResponseEntity(HttpStatus.NOT_FOUND)
        }
        pendingBookingService.deletePendingBooking(pendingBookingID)
        return ResponseEntity.ok("Pending booking with ID $pendingBookingID has been deleted")
    }

}