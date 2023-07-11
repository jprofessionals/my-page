package no.jpro.mypageapi.controller

import io.ktor.util.date.*
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BookingService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.net.URI
import java.time.LocalDate
import java.time.format.DateTimeParseException
import java.util.*

@RestController
@RequestMapping("booking")
@SecurityRequirement(name = "Bearer Authentication")
class BookingController(
    private val bookingService: BookingService,
    private val userService: UserService,
    ) {
    @GetMapping("{bookingID}")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Get the booking connected to the booking id")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BookingDTO::class)
            )
        )]
    )
    fun getBooking(
        token: JwtAuthenticationToken,
        @PathVariable("bookingID") bookingID: Long,
    ): Booking? {
        return bookingService.getBooking(bookingID)
    }

    @GetMapping
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Get all bookings in the given month")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BookingDTO::class)
            )
        )]
    )

    fun getBookingsPerMonth(
        token: JwtAuthenticationToken,
        @RequestParam("startDate") startDate: String,
        @RequestParam("endDate") endDate: String,
    ): ResponseEntity<List<BookingDTO>?> {
        try {
            val parsedStartDate: LocalDate = LocalDate.parse(startDate)
            val parsedEndDate: LocalDate = LocalDate.parse(endDate)
            val bookings: List<BookingDTO> = bookingService.getBookingsBetweenDates(parsedStartDate, parsedEndDate)
            return ResponseEntity.ok(bookings)
        } catch (e: DateTimeParseException) {
            throw InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @ExceptionHandler(InvalidDateException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleInvalidDateException(e: InvalidDateException): ErrorResponse {
        return ErrorResponse(e.message)
    }

    data class ErrorResponse(val message: String?)

    class InvalidDateException(message: String) : RuntimeException(message)


    @GetMapping("employee/{employee_id}")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Get the booking connected to the employee id")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BookingDTO::class)
            )
        )]
    )
    fun getBookings(
        token: JwtAuthenticationToken,
        @PathVariable("employee_id") employee_id: Int,
    ): List<BookingDTO>? {
        return bookingService.getBookings(employee_id)
    }

    @GetMapping("/date")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Get all bookings on the specified date")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BookingDTO::class)
            )
        )]
    )

    fun getBookingsPerDay(
        token: JwtAuthenticationToken,
        @RequestParam("date") date: String,
    ): ResponseEntity<List<BookingDTO>?> {
        try {
            val parsedDate: LocalDate = LocalDate.parse(date)
            val bookings: List<BookingDTO> = bookingService.getBookingsOnDay(parsedDate)
            return ResponseEntity.ok(bookings)
        } catch (e: DateTimeParseException) {
            throw InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }
    @PostMapping
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Create a new booking")
    @ApiResponse(
        responseCode = "201",
        description = "New booking created",
        content = [Content(schema = Schema(implementation = BookingDTO::class))]
    )
    fun createBooking(
        token: JwtAuthenticationToken,
        @Validated @Valid @RequestBody createBookingDTO: CreateBookingDTO
    ): ResponseEntity<Any> {
        val minApartmentID = 1
        val maxApartmentID = 3

        try {
            val startDate = createBookingDTO.startDate
            val endDate = createBookingDTO.endDate

            if (startDate.isAfter(endDate)) {
                throw InvalidBookingDatesException("Start date cannot be after the end date.")
            }

            val apartmentId = createBookingDTO.apartmentId
            if (apartmentId < minApartmentID || apartmentId > maxApartmentID) {
                throw InvalidApartmentIdException("There is no apartment with that ID.")
            }

            val user = userService.getUserBySub(token.getSub())
            val employeeName = user?.name

            val booking = bookingService.createBooking(apartmentId, startDate, endDate, employeeName)

            val apartmentDTO = Apartment(
                id = booking.apartment?.id,
                cabin_name = booking.apartment?.cabin_name
            )

            val bookingDTO = BookingDTO(
                id = booking.id,
                startDate = booking.startDate,
                endDate = booking.endDate,
                apartment = apartmentDTO,
                employeeName = employeeName
            )

            val location = URI.create("booking/${booking.id}")

            return ResponseEntity.created(location).body(bookingDTO)
        } catch (e: InvalidBookingDatesException) {
            val errorMessage = e.message ?: "Invalid booking dates"
            val errorResponse = ErrorResponse(errorMessage)
            return ResponseEntity.badRequest().body(errorResponse)
        } catch (e: InvalidApartmentIdException) {
            val errorMessage = e.message ?: "Invalid apartment ID"
            val errorResponse = ErrorResponse(errorMessage)
            return ResponseEntity.badRequest().body(errorResponse)
        }
    }

    @ExceptionHandler(InvalidBookingDatesException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleInvalidBookingDatesException(e: InvalidBookingDatesException): ErrorResponse {
        return ErrorResponse(e.message)
    }
    class InvalidBookingDatesException(message: String) : RuntimeException(message)

    @ExceptionHandler(InvalidApartmentIdException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleInvalidApartmentIdException(e: InvalidApartmentIdException): ErrorResponse {
        return ErrorResponse(e.message)
    }
    class InvalidApartmentIdException(message: String) : RuntimeException(message)
}

