package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.PendingBookingService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.format.DateTimeParseException

@RestController
@RequestMapping("pendingBooking")
@SecurityRequirement(name = "Bearer Authentication")
class PendingBookingController (
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
        val user = userService.getUserBySub(token.getSub()) ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        try {
            pendingBookingService.createPendingBooking(bookingRequest, user)
            return ResponseEntity.ok("A new booking has been successfully created")
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().body(e.message)
        }
    }

    @GetMapping("/trainDTOPeriodAllApartments")
    @Transactional
    @Operation(summary = "Get pending booking train DTO for all apartments in a period")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = PendingBookingTrainDTO::class)
            )
        )]
    )
    fun getTrainAndPendingBookingsPeriodAllApartment(
        token: JwtAuthenticationToken,
    ): List<List<PendingBookingTrainDTO>> {
        try {
            return pendingBookingService.getTrainAndPendingBookingsPeriodAllApartment()
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }


    @GetMapping("/getPendingBookingDTOForDrawingPeriods")
    @Transactional
    @Operation(summary = "Get pending booking train DTO for all apartments in a period")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = DrawingPeriodDTO::class)
            )
        )]
    )
    fun getPendingBookingDTOForDrawingPeriods(
        token: JwtAuthenticationToken,
        @RequestParam("apartmentID") apartmentID: Long,
        ): List<DrawingPeriodDTO> {
        try {
            return pendingBookingService.getPendingBookingDTOForDrawingPeriods(apartmentID)
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }








}