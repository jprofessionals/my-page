package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.service.BookingService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.format.DateTimeParseException
import org.springframework.http.ResponseEntity
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus

/**
 * Legacy BookingController - endpoints not yet migrated to OpenAPI.
 *
 * NOTE: Most booking endpoints have been moved to BookingApiDelegateImpl.
 * Only legacy/internal endpoints remain here.
 *
 * Migrated endpoints (use BookingApiDelegateImpl):
 * - GET /booking (with dates) -> getBookings()
 * - GET /booking/apartment -> getApartments()
 * - GET /booking/my-bookings -> getMyBookings()
 * - DELETE /booking/{bookingId} -> deleteBooking()
 * - PATCH /booking/{bookingId} -> updateBooking()
 * - DELETE /booking/admin/{bookingId} -> adminDeleteBooking()
 * - PATCH /booking/admin/{bookingId} -> adminUpdateBooking()
 * - POST /booking/admin/post -> adminCreateBooking()
 */
@RestController
@RequestMapping("booking")
@SecurityRequirement(name = "Bearer Authentication")
class BookingController(
    private val bookingService: BookingService
) {

    @GetMapping("{bookingID}")
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
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable("bookingID") bookingID: Long,
    ): Booking? {
        return bookingService.getBooking(bookingID)
    }

    @GetMapping("employee/{employee_id}")
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
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable("employee_id") employee_id: Int,
    ): List<BookingDTO>? {
        return bookingService.getBookings(employee_id)
    }

    @GetMapping("/date")
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
        @AuthenticationPrincipal jwt: Jwt?,
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

    @ExceptionHandler(InvalidDateException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleInvalidDateException(e: InvalidDateException): ErrorResponse {
        return ErrorResponse(e.message)
    }

    data class ErrorResponse(val message: String?)

    class InvalidDateException(message: String) : RuntimeException(message)
}