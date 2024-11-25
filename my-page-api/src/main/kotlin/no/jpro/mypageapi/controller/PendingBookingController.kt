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
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BookingLotteryService
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
class PendingBookingController(
    private val pendingBookingService: PendingBookingService,
    private val userService: UserService,
    private val bookingLotteryService: BookingLotteryService
) {

    @GetMapping
    @Transactional
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
        pendingBookingService.createPendingBooking(bookingRequest, user, false)
        return ResponseEntity("A new booking has been successfully created", HttpStatus.CREATED)
    }

    @RequiresAdmin
    @PostMapping("/pendingPostForUser")
    @Transactional
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
    ): List<PendingBookingTrainDTO> {
        try {
            return pendingBookingService.getPendingBookingInformation()
        } catch (e: DateTimeParseException) {
            throw BookingController.InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
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
        val user =
            userService.getUserBySub(token.getSub()) ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        if (!userPermittedToEditBooking(pendingBooking, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }

        pendingBookingService.deletePendingBooking(pendingBookingID)
        return ResponseEntity.ok("Pending booking with ID $pendingBookingID has been deleted")
    }

    @PatchMapping("{pendingBookingId}")
    @Transactional
    @Operation(summary = "Edit an existing pending booking")
    fun editPendingBooking(
        token: JwtAuthenticationToken,
        @PathVariable("pendingBookingId") pendingBookingId: Long,
        @Valid @RequestBody editBookingRequest: UpdateBookingDTO,
    ): ResponseEntity<String> {
        val bookingToEdit = pendingBookingService.getPendingBooking(pendingBookingId) ?: return ResponseEntity.notFound().build()
        val user =
            userService.getUserBySub(token.getSub()) ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()

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
