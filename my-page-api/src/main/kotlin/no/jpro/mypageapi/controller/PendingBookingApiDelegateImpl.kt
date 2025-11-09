package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.PendingBookingApiDelegate
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.model.PendingBookingDTO
import no.jpro.mypageapi.service.PendingBookingService
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.AuthenticationHelper
import no.jpro.mypageapi.utils.mapper.PendingBookingMapper
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class PendingBookingApiDelegateImpl(
    private val pendingBookingService: PendingBookingService,
    private val userService: UserService,
    private val pendingBookingMapper: PendingBookingMapper,
    private val bookingLotteryService: no.jpro.mypageapi.service.BookingLotteryService,
    private val authHelper: AuthenticationHelper,
    private val request: Optional<NativeWebRequest>
) : PendingBookingApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getMyPendingBookings(): ResponseEntity<List<PendingBookingDTO>> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val authentication = SecurityContextHolder.getContext().authentication

        // In development mode, support test user header
        if (authHelper.isDevelopmentProfile()) {
            val testUser = authHelper.getTestUserById(testUserId)
            if (testUser?.sub != null) {
                val pendingBookingDTOs = pendingBookingService.getUserPendingBookings(testUser.sub)
                val models = pendingBookingDTOs.map { pendingBookingMapper.toPendingBookingModel(it) }
                return ResponseEntity.ok(models)
            }
        }

        // For production or when no test user, use JWT
        if (authentication is JwtAuthenticationToken) {
            val sub = authentication.getSub()
            val pendingBookingDTOs = pendingBookingService.getUserPendingBookings(sub)
            val models = pendingBookingDTOs.map { pendingBookingMapper.toPendingBookingModel(it) }
            return ResponseEntity.ok(models)
        }

        return ResponseEntity.status(401).build()
    }

    override fun createPendingBooking(createPendingBooking: no.jpro.mypageapi.model.CreatePendingBooking): ResponseEntity<String> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val authentication = SecurityContextHolder.getContext().authentication

        // Get current user
        val user = if (authHelper.isDevelopmentProfile()) {
            authHelper.getTestUserById(testUserId)
        } else null
            ?: if (authentication is JwtAuthenticationToken) {
                userService.getUserBySub(authentication.getSub())
            } else null
            ?: return ResponseEntity.status(403).body("Forbidden")

        val createPendingBookingDTO = pendingBookingMapper.toCreatePendingBookingDTO(createPendingBooking)
        pendingBookingService.createPendingBooking(createPendingBookingDTO, user!!, false)

        return ResponseEntity.status(201)
            .body("A new booking has been successfully created")
    }

    override fun createPendingBookingForUser(bookingOwnerName: String, createPendingBooking: no.jpro.mypageapi.model.CreatePendingBooking): ResponseEntity<String> {
        val user = userService.getUserByName(bookingOwnerName)
            ?: return ResponseEntity.status(404).body("User not found")

        val createPendingBookingDTO = pendingBookingMapper.toCreatePendingBookingDTO(createPendingBooking)
        pendingBookingService.createPendingBooking(createPendingBookingDTO, user, true)

        return ResponseEntity.status(201)
            .body("A new booking has been successfully created for ${user.name}")
    }

    override fun getPendingBookingInformation(): ResponseEntity<List<no.jpro.mypageapi.model.PendingBookingTrain>> {
        val trains = pendingBookingService.getPendingBookingInformation()
        val models = trains.map { pendingBookingMapper.toPendingBookingTrainModel(it) }
        return ResponseEntity.ok(models)
    }

    override fun pickWinnerPendingBooking(pendingBookingDTO: List<no.jpro.mypageapi.model.PendingBookingDTO>): ResponseEntity<String> {
        val dtos = pendingBookingDTO.map { pendingBookingMapper.toPendingBookingDTO(it) }
        bookingLotteryService.pickWinnerPendingBooking(dtos)
        return ResponseEntity.status(201).body("A new booking has been successfully created")
    }

    override fun adminDeletePendingBooking(pendingBookingId: Long): ResponseEntity<String> {
        val pendingBooking = pendingBookingService.getPendingBooking(pendingBookingId)
            ?: return ResponseEntity.status(404).body("Pending booking not found")

        pendingBookingService.deletePendingBooking(pendingBookingId)
        return ResponseEntity.ok("Pending booking with ID $pendingBookingId has been deleted")
    }

    override fun deleteMyPendingBooking(pendingBookingId: Long): ResponseEntity<String> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val authentication = SecurityContextHolder.getContext().authentication

        // Get current user
        val user = if (authHelper.isDevelopmentProfile()) {
            authHelper.getTestUserById(testUserId)
        } else null
            ?: if (authentication is JwtAuthenticationToken) {
                userService.getUserBySub(authentication.getSub())
            } else null
            ?: return ResponseEntity.status(401).body("Unauthorized")

        val pendingBooking = pendingBookingService.getPendingBooking(pendingBookingId)
            ?: return ResponseEntity.status(404).body("Pending booking not found")

        // Check permission
        if (pendingBooking.employee?.id != user?.id) {
            return ResponseEntity.status(403).body("Forbidden")
        }

        pendingBookingService.deletePendingBooking(pendingBookingId)
        return ResponseEntity.ok("Pending booking with ID $pendingBookingId has been deleted")
    }

    override fun updatePendingBooking(pendingBookingId: Long, bookingUpdate: no.jpro.mypageapi.model.BookingUpdate): ResponseEntity<Unit> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val authentication = SecurityContextHolder.getContext().authentication

        // Get current user
        val user = if (authHelper.isDevelopmentProfile()) {
            authHelper.getTestUserById(testUserId)
        } else null
            ?: if (authentication is JwtAuthenticationToken) {
                userService.getUserBySub(authentication.getSub())
            } else null
            ?: return ResponseEntity.status(401).build()

        val bookingToEdit = pendingBookingService.getPendingBooking(pendingBookingId)
            ?: return ResponseEntity.notFound().build()

        // Check permission
        if (bookingToEdit.employee?.id != user?.id) {
            return ResponseEntity.status(403).build()
        }

        try {
            val updateBookingDTO = pendingBookingMapper.toUpdateBookingDTO(bookingUpdate)
            pendingBookingService.editPendingBooking(updateBookingDTO, bookingToEdit)
            return ResponseEntity.ok().build()
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.status(400).build()
        }
    }
}