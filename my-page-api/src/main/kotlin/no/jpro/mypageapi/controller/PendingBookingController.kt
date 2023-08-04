package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingTrainDTO
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

    //TODO SLETT
    @GetMapping("/pendingBookingDateList")
    @Transactional
    @Operation(summary = "Get all pending booking train dates with no duplicates")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = LocalDate::class)
            )
        )]
    )
    fun getPendingBookingDateRange(
        token: JwtAuthenticationToken,
        @RequestParam("apartmentID") apartmentID: Long,
        @RequestParam("startDate") startDate: LocalDate,
        @RequestParam("endDate") endDate: LocalDate,
    ): List<List<LocalDate>> {
        val newStartDate = startDate.minusDays(7)
        try {
            return pendingBookingService.getDateListOfPendingBookingTrains(apartmentID, newStartDate, endDate)
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @GetMapping("/test")
    @Transactional
    @Operation(summary = "Get all pending booking dates with no duplicates in date range")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = LocalDate::class)
            )
        )]
    )
    fun getDatesInPendingBookingTrainForSelectedDate(
        token: JwtAuthenticationToken,
        @RequestParam("apartmentID") apartmentID: Long,
        @RequestParam("selectedDate") selectedDate: LocalDate,
    ): List<LocalDate>? {
        try {
            return pendingBookingService.getDatesForPendingBookingTrainOnSelectedDate(apartmentID, selectedDate)
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @GetMapping("/test2")
    @Transactional
    @Operation(summary = "Get all pending booking dates with no duplicates in date range")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = PendingBookingDTO::class)
            )
        )]
    )
    fun getPendingBookingsInTrain(
        token: JwtAuthenticationToken,
        @RequestParam("apartmentID") apartmentID: Long,
        @RequestParam("selectedDate") selectedDate: LocalDate,
    ): List<PendingBookingDTO> {
        try {
            return pendingBookingService.getPendingBookingsInTrain(apartmentID, selectedDate)
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @GetMapping("/trainDTOPeriod")
    @Transactional
    @Operation(summary = "Get pending booking train DTO for period")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = PendingBookingTrainDTO::class)
            )
        )]
    )
    fun getTrainAndPendingBookingsPeriod(
        token: JwtAuthenticationToken,
        @RequestParam("apartmentID") apartmentID: Long,
    ): List<PendingBookingTrainDTO> {
        try {
            return pendingBookingService.getTrainAndPendingBookingsPeriod(apartmentID)
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
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


}