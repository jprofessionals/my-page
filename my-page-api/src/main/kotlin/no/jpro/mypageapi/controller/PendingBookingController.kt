package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.controller.BookingController.InvalidDateException
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingTrainDTO
import no.jpro.mypageapi.dto.UpdateBookingDTO
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BookingLotteryService
import no.jpro.mypageapi.service.PendingBookingService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.format.DateTimeParseException

// NOTE: This controller has been replaced by PendingBookingApiDelegateImpl
// All endpoints are now handled by OpenAPI-generated controllers
// Disabled to prevent ambiguous handler mapping conflicts
//@RestController
//@RequestMapping("pendingBooking")
@SecurityRequirement(name = "Bearer Authentication")
class PendingBookingController(
    private val pendingBookingService: PendingBookingService,
    private val userService: UserService,
    private val bookingLotteryService: BookingLotteryService
) {

    @GetMapping
    @Operation(summary = "Get all pending bookings in the given date range")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = PendingBookingDTO::class)
            )
        )]
    )
    fun getPendingBookings(
        token: JwtAuthenticationToken,
        @RequestParam("startDate") startDate: String,
        @RequestParam("endDate") endDate: String,
    ): ResponseEntity<List<PendingBookingDTO>?> {
        try {
            val parsedStartDate: LocalDate = LocalDate.parse(startDate)
            val parsedEndDate: LocalDate = LocalDate.parse(endDate)
            val pendingBookings: List<PendingBookingDTO> = pendingBookingService.getPendingBookingsBetweenDates(parsedStartDate, parsedEndDate)
            return ResponseEntity.ok(pendingBookings)
        } catch (e: DateTimeParseException) {
            throw InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @PostMapping("/pendingPost")
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
        val user = userService.getValidUserBySub(token.getSub())
        pendingBookingService.createPendingBooking(bookingRequest, user, false)
        return ResponseEntity("A new booking has been successfully created", HttpStatus.CREATED)
    }

    @RequiresAdmin
    @PostMapping("/pendingPostForUser")
    @Operation(summary = "Create a new pending booking on behalf of a user")
    @ApiResponse(
        responseCode = "201",
        description = "New booking created",
        content = [Content(schema = Schema(implementation = BookingDTO::class))]
    )
    fun createPendingBookingForUser(
        token: JwtAuthenticationToken,
        @Valid @RequestBody bookingRequest: CreatePendingBookingDTO,
        bookingOwnerName: String
    ): ResponseEntity<String> {
        val user =
            userService.getUserByName(bookingOwnerName) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        pendingBookingService.createPendingBooking(bookingRequest, user, true)
        return ResponseEntity("A new booking has been successfully created for " + user.name, HttpStatus.CREATED)
    }

    @GetMapping("/pendingBookingInformation")
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
    ): List<PendingBookingTrainDTO> {
        return pendingBookingService.getPendingBookingInformation()
    }

    @PostMapping("/pendingBookingWin")
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
        bookingLotteryService.pickWinnerPendingBooking(pendingBookingList)
        return ResponseEntity("A new booking has been successfully created", HttpStatus.CREATED)
    }

    @DeleteMapping("admin/{pendingBookingID}")
    @RequiresAdmin
    @Operation(summary = "Delete the pending booking connected to the pending booking id")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json")]
    )
    fun adminDeletePendingBooking(
        token: JwtAuthenticationToken,
        @PathVariable("pendingBookingID") pendingBookingID: Long,
    ): ResponseEntity<String> {
        val pendingBooking = pendingBookingService.getPendingBooking(pendingBookingID)
        if (pendingBooking === null) {
            return ResponseEntity(HttpStatus.NOT_FOUND)
        }
        pendingBookingService.deletePendingBooking(pendingBookingID)
        return ResponseEntity.ok("Pending booking with ID $pendingBookingID has been deleted")
    }

    @DeleteMapping("{pendingBookingID}")
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
        if (pendingBooking === null) {
            return ResponseEntity(HttpStatus.NOT_FOUND)
        }
        val user = userService.getValidUserBySub(token.getSub())
        if (!userPermittedToEditBooking(pendingBooking, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }

        pendingBookingService.deletePendingBooking(pendingBookingID)
        return ResponseEntity.ok("Pending booking with ID $pendingBookingID has been deleted")
    }

    @PatchMapping("{pendingBookingId}")
    @Operation(summary = "Edit an existing pending booking")
    fun editPendingBooking(
        token: JwtAuthenticationToken,
        @PathVariable("pendingBookingId") pendingBookingId: Long,
        @Valid @RequestBody editBookingRequest: UpdateBookingDTO,
    ): ResponseEntity<String> {
        val bookingToEdit = pendingBookingService.getPendingBooking(pendingBookingId) ?: return ResponseEntity.notFound().build()
        val user = userService.getValidUserBySub(token.getSub())

        if (!userPermittedToEditBooking(bookingToEdit, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }
        try {
            pendingBookingService.editPendingBooking(editBookingRequest, bookingToEdit)
            return ResponseEntity.ok("The booking has been successfully edited")
        } catch (e: IllegalArgumentException) {
            val errorMessage = e.message ?: "An error occurred while editing the booking."
            throw MyPageRestException(HttpStatus.BAD_REQUEST, errorMessage)
        }
    }

    private fun userPermittedToEditBooking(booking: PendingBooking, employee: User) = (booking.employee?.id == employee.id)
}
