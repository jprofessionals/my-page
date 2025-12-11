package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.BookingApiDelegate
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.model.Apartment
import no.jpro.mypageapi.model.Booking
import no.jpro.mypageapi.model.BookingUpdate
import no.jpro.mypageapi.model.NotifyUpcomingBookings200Response
import no.jpro.mypageapi.service.BookingService
import no.jpro.mypageapi.service.SlackNotificationService
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.AuthenticationHelper
import no.jpro.mypageapi.utils.mapper.ApartmentMapper
import no.jpro.mypageapi.utils.mapper.BookingMapper
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.time.LocalDate
import java.util.*

@Service
class BookingApiDelegateImpl(
    private val bookingService: BookingService,
    private val userService: UserService,
    private val bookingMapper: BookingMapper,
    private val apartmentMapper: ApartmentMapper,
    private val authHelper: AuthenticationHelper,
    private val slackNotificationService: SlackNotificationService,
    private val request: Optional<NativeWebRequest>
) : BookingApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getApartments(): ResponseEntity<List<Apartment>> {
        val apartments = bookingService.getAllApartments()
        val apartmentModels = apartments.map { apartmentMapper.toApartmentModel(it) }
        return ResponseEntity.ok(apartmentModels)
    }

    override fun getBookings(startDate: LocalDate, endDate: LocalDate): ResponseEntity<List<Booking>> {
        val bookings = bookingService.getBookingsBetweenDates(startDate, endDate)
        val bookingModels = bookings.map { bookingMapper.toBookingModel(it) }
        return ResponseEntity.ok(bookingModels)
    }

    override fun getMyBookings(): ResponseEntity<List<Booking>> {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication is JwtAuthenticationToken) {
            val sub = authentication.getSub()
            val bookings = bookingService.getUserBookings(sub)
            val bookingModels = bookings.map { bookingMapper.toBookingModel(it) }
            return ResponseEntity.ok(bookingModels)
        }
        return ResponseEntity.status(401).build()
    }

    override fun deleteBooking(bookingId: Long): ResponseEntity<Unit> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)

        // Get current user
        val user = authHelper.getCurrentUser(testUserId)
            ?: return ResponseEntity.status(401).build()

        // Check if booking exists
        val booking = bookingService.getBooking(bookingId)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()

        // Check permission
        if (booking.employee?.id != user.id) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        bookingService.deleteBookingAndNotifySlack(bookingId)
        return ResponseEntity.ok().build()
    }

    override fun updateBooking(bookingId: Long, bookingUpdate: BookingUpdate): ResponseEntity<Unit> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)

        // Get current user
        val user = authHelper.getCurrentUser(testUserId)
            ?: return ResponseEntity.status(401).build()

        // Check if booking exists
        val bookingToEdit = bookingService.getBooking(bookingId)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()

        // Check permission
        if (bookingToEdit.employee?.id != user.id) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val updateBookingDTO = bookingMapper.toUpdateBookingDTO(bookingUpdate)
            bookingService.validateAndEditBooking(updateBookingDTO, bookingToEdit)
            return ResponseEntity.ok().build()
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        }
    }

    override fun adminCreateBooking(bookingOwnerName: String, createBooking: no.jpro.mypageapi.model.CreateBooking): ResponseEntity<String> {
        val bookingOwner = userService.getUserByName(bookingOwnerName)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found")

        val createBookingDTO = bookingMapper.toCreateBookingDTO(createBooking)
        bookingService.createBooking(createBookingDTO, bookingOwner)

        return ResponseEntity.status(HttpStatus.CREATED)
            .body("A new booking has been successfully created")
    }

    override fun adminDeleteBooking(bookingId: Long): ResponseEntity<Unit> {
        val booking = bookingService.getBooking(bookingId)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()

        bookingService.deleteBooking(bookingId)
        return ResponseEntity.ok().build()
    }

    override fun adminUpdateBooking(bookingId: Long, bookingUpdate: BookingUpdate): ResponseEntity<Unit> {
        val bookingToEdit = bookingService.getBooking(bookingId)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).build()

        try {
            val updateBookingDTO = bookingMapper.toUpdateBookingDTO(bookingUpdate)
            bookingService.validateAndEditBooking(updateBookingDTO, bookingToEdit)
            return ResponseEntity.ok().build()
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        }
    }

    override fun notifyUpcomingBookings(testMode: Boolean): ResponseEntity<NotifyUpcomingBookings200Response> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)

        // Check if user is admin
        val user = authHelper.getCurrentUser(testUserId)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!user.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        val testModeEmail = if (testMode) user.email else null
        val result = slackNotificationService.notifySlackChannelWithUpcomingBookings(testModeEmail)
        return ResponseEntity.ok(NotifyUpcomingBookings200Response(message = result))
    }
}