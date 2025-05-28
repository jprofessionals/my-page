package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.ApartmentDTO
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.UpdateBookingDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BookingService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.format.DateTimeParseException

@RestController
@RequestMapping("booking")
@SecurityRequirement(name = "Bearer Authentication")
class BookingController(
    private val bookingService: BookingService,
    private val userService: UserService
) {
    @GetMapping("{bookingID}")
    @Transactional
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
    @Operation(summary = "Get all bookings in the given month")
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

    @GetMapping("/vacancy")
    @Transactional
    @Operation(summary = "Gets booking vacancies in a time period for all apartments")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json",
            schema = Schema(implementation = BookingDTO::class)
        )]
    )

    fun getVacancies(
        token: JwtAuthenticationToken,
        @RequestParam("startdate") startdate: String,
        @RequestParam("enddate") enddate: String,

        ): ResponseEntity<Map<Long, List<LocalDate>>> {

        try {
            val parsedStartDate: LocalDate = LocalDate.parse(startdate)
            val parsedEndDate: LocalDate = LocalDate.parse(enddate)
            val availability = bookingService.getAllVacanciesInAPeriod(parsedStartDate, parsedEndDate)
            return ResponseEntity.ok(availability)
        } catch (e: DateTimeParseException) {
            throw InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @GetMapping("/apartment")
    @Transactional
    @Operation(summary = "Gets all apartments")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json",
            schema = Schema(implementation = ApartmentDTO::class)
        )]
    )

    fun getApartments(
        token: JwtAuthenticationToken,

        ): List<ApartmentDTO> {
        return bookingService.getAllApartments()
    }

    @DeleteMapping("{bookingID}")
    @Operation(summary = "Delete the booking connected to the booking id")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json")]
    )
    fun deleteBooking(
        token: JwtAuthenticationToken,
        @PathVariable("bookingID") bookingID: Long,
    ): ResponseEntity<String> {

        val user = userService.getUserBySub(token.getSub()) ?: return ResponseEntity(HttpStatus.FORBIDDEN)
        val booking = bookingService.getBooking(bookingID) ?: return ResponseEntity(HttpStatus.NOT_FOUND)

        if (!userPermittedToDeleteBooking(booking, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }

        bookingService.deleteBookingAndNotifySlack(bookingID)
        return ResponseEntity.ok("Booking with ID $bookingID has been deleted")
    }

    private fun userPermittedToDeleteBooking(booking: Booking, user: User) = (booking.employee?.id == user.id)


    @Deprecated("Bare admin kan opprette booking, bruk createPendingBooking i stedet")
    @PostMapping("/post")
    @Transactional
    @Operation(summary = "Create a new booking")
    @ApiResponse(
        responseCode = "201",
        description = "New booking created",
        content = [Content(schema = Schema(implementation = BookingDTO::class))]
    )
    fun createBooking(
        token: JwtAuthenticationToken,
        @Valid @RequestBody bookingRequest: CreateBookingDTO,
    ): ResponseEntity<String> {
        val user =
            userService.getUserBySub(token.getSub()) ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()

        bookingService.validateCutoffAndCreateBooking(bookingRequest, user)
        return ResponseEntity("A new booking has been successfully created", HttpStatus.CREATED)
    }

    @PatchMapping("{bookingId}")
    @Transactional
    @Operation(summary = "Edit an existing booking")
    fun editBooking(
        token: JwtAuthenticationToken,
        @PathVariable("bookingId") bookingId: Long,
        @Valid @RequestBody editBookingRequest: UpdateBookingDTO,
    ): ResponseEntity<String> {
        val bookingToEdit = bookingService.getBooking(bookingId) ?: return ResponseEntity.notFound().build()
        val user =
            userService.getUserBySub(token.getSub()) ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()

        if (!userPermittedToEditBooking(bookingToEdit, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }
        try {
            bookingService.validateAndEditBooking(editBookingRequest, bookingToEdit)
            return ResponseEntity.ok("The booking has been successfully edited")
        } catch (e: IllegalArgumentException) {
            val errorMessage = e.message ?: "An error occurred while editing the booking."
            throw MyPageRestException(HttpStatus.BAD_REQUEST, errorMessage)
        }

    }

    private fun userPermittedToEditBooking(booking: Booking, employee: User) = (booking.employee?.id == employee.id)

    @PatchMapping("admin/{bookingId}")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "An admin edits an existing booking")
    fun adminEditBooking(
        token: JwtAuthenticationToken,
        @PathVariable("bookingId") bookingId: Long,
        @Valid @RequestBody editBookingRequest: UpdateBookingDTO,
    ): ResponseEntity<String> {
        val bookingToEdit = bookingService.getBooking(bookingId) ?: return ResponseEntity.notFound().build()
        try {
            bookingService.editBooking(editBookingRequest, bookingToEdit)
            return ResponseEntity.ok("The booking has been successfully edited")
        } catch (e: IllegalArgumentException) {
            val errorMessage = e.message ?: "An error occurred while editing the booking."
            throw MyPageRestException(HttpStatus.BAD_REQUEST, errorMessage)
        }
    }

    @DeleteMapping("admin/{bookingID}")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "An admin deletes the booking connected to the booking id")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json")]
    )
    fun adminDeleteBooking(
        token: JwtAuthenticationToken,
        @PathVariable("bookingID") bookingID: Long,
    ): ResponseEntity<String> {
        val booking = bookingService.getBooking(bookingID)
        if (booking === null) {
            return ResponseEntity(HttpStatus.NOT_FOUND)
        }
        bookingService.deleteBooking(bookingID)
        return ResponseEntity.ok("Booking with ID $bookingID has been deleted")
    }

    @PostMapping("/admin/post")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Admin creates a new booking for a user")
    @ApiResponse(
        responseCode = "201",
        description = "New booking created",
        content = [Content(schema = Schema(implementation = BookingDTO::class))]
    )
    fun adminCreateBooking(
        token: JwtAuthenticationToken,
        @Valid @RequestBody bookingRequest: CreateBookingDTO, bookingOwnerName: String,
    ): ResponseEntity<String> {
        val bookingOwner =
            userService.getUserByName(bookingOwnerName) ?: return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        bookingService.createBooking(bookingRequest, bookingOwner)
        return ResponseEntity("A new booking has been successfully created", HttpStatus.CREATED)
    }
}

