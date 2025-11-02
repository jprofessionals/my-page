package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.PendingBookingApiDelegate
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.model.PendingBookingDTO
import no.jpro.mypageapi.service.PendingBookingService
import no.jpro.mypageapi.service.UserService
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
    private val environment: org.springframework.core.env.Environment,
    private val request: Optional<NativeWebRequest>
) : PendingBookingApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getMyPendingBookings(): ResponseEntity<List<PendingBookingDTO>> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val authentication = SecurityContextHolder.getContext().authentication

        // In development mode, support test user header
        if (isDevelopmentProfile()) {
            val testUser = userService.getTestUserById(testUserId)
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
        val user = if (isDevelopmentProfile()) {
            userService.getTestUserById(testUserId)
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

    private fun isDevelopmentProfile(): Boolean {
        return environment.activeProfiles.any { it == "local" || it == "h2" || it == "test" }
    }
}