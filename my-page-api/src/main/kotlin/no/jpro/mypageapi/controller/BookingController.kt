package no.jpro.mypageapi.controller

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
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

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

    @GetMapping("{startDate}/{endDate}")
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
        @PathVariable("startDate") startDate: LocalDate,
        @PathVariable("endDate") endDate: LocalDate,
    ): List<BookingDTO>? {
        return bookingService.getBookingsBetweenDates(startDate, endDate)
    }

    @GetMapping("booking/{employee_id}")
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


}

