package no.jpro.mypageapi.controller

import io.ktor.util.date.*
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.service.BookingService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.format.DateTimeParseException
import java.util.*

@RestController
@RequestMapping("booking")
@SecurityRequirement(name = "Bearer Authentication")
class BookingController(private val bookingService: BookingService) {
    @GetMapping("{bookingID}")
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
}

