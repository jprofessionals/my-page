package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.DrawingStatus
import no.jpro.mypageapi.service.CabinDrawingService
import no.jpro.mypageapi.service.CabinWishService
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.core.env.Environment
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("cabin-lottery")
// @SecurityRequirement(name = "Bearer Authentication") // Commented for local dev - TODO: uncomment for production
@Tag(name = "Cabin Lottery", description = "User endpoints for cabin lottery")
class CabinLotteryController(
    private val drawingService: CabinDrawingService,
    private val wishService: CabinWishService,
    private val userRepository: UserRepository,
    private val bookingService: no.jpro.mypageapi.service.BookingService,
    private val environment: Environment
) {

    // For local development without authentication, use or create a test user
    private fun getOrCreateTestUser(): no.jpro.mypageapi.entity.User {
        return userRepository.findUserBySub("test-user")
            ?: userRepository.save(no.jpro.mypageapi.entity.User(
                sub = "test-user",
                name = "Test User",
                email = "test@example.com",
                givenName = "Test",
                familyName = "User",
                budgets = emptyList()
            ))
    }

    // For local development - get user by ID from header
    private fun getTestUserById(testUserId: String?): no.jpro.mypageapi.entity.User? {
        if (testUserId == null) return null
        return userRepository.findById(testUserId).orElse(null)
    }

    // Check if we're running in a development profile (local or h2)
    private fun isDevelopmentProfile(): Boolean {
        return environment.activeProfiles.any { it == "local" || it == "h2" }
    }

    // Get the current user for local dev - supports test user ID header
    private fun getCurrentUser(jwt: Jwt?, testUserId: String?): no.jpro.mypageapi.entity.User {
        // Only accept test user header in development profiles (local/h2)
        if (isDevelopmentProfile()) {
            val testUser = getTestUserById(testUserId)
            if (testUser != null) return testUser
        }

        // Otherwise use normal auth flow
        return if (jwt == null) {
            // In development, create a test user if needed
            if (isDevelopmentProfile()) {
                getOrCreateTestUser()
            } else {
                throw IllegalArgumentException("Authentication required")
            }
        } else {
            userRepository.findUserBySub(jwt.subject ?: throw IllegalArgumentException("Authentication required"))
                ?: throw IllegalArgumentException("User not found")
        }
    }
    
    @GetMapping("/current")
    @Operation(summary = "Get the current active drawing (excludes DRAFT)")
    fun getCurrentDrawing(@AuthenticationPrincipal jwt: Jwt?): ResponseEntity<CabinDrawingDTO?> {
        // Users should not see DRAFT drawings - only OPEN, LOCKED, DRAWN or PUBLISHED
        val drawing = drawingService.getCurrentDrawingForUsers()
        return ResponseEntity.ok(drawing)
    }

    @GetMapping("/drawings/{drawingId}")
    @Operation(summary = "Get drawing details")
    fun getDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<CabinDrawingDTO> {
        val drawing = drawingService.getDrawing(drawingId)
        return ResponseEntity.ok(drawing)
    }

    @GetMapping("/drawings/{drawingId}/periods")
    @Operation(summary = "Get all periods for a drawing")
    fun getPeriods(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<List<CabinPeriodDTO>> {
        val periods = drawingService.getPeriods(drawingId)
        return ResponseEntity.ok(periods)
    }

    @PostMapping("/drawings/{drawingId}/wishes")
    @Operation(summary = "Submit wishes for a drawing")
    fun submitWishes(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestBody dto: BulkCreateWishesDTO,
        @RequestHeader("X-Test-User-Id", required = false) testUserId: String?
    ): ResponseEntity<List<CabinWishDTO>> {
        val user = getCurrentUser(jwt, testUserId)
        val wishes = wishService.createWishes(drawingId, user, dto)
        return ResponseEntity.ok(wishes)
    }

    @GetMapping("/drawings/{drawingId}/my-wishes")
    @Operation(summary = "Get my wishes for a drawing")
    fun getMyWishes(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestHeader("X-Test-User-Id", required = false) testUserId: String?
    ): ResponseEntity<List<CabinWishDTO>> {
        val user = getCurrentUser(jwt, testUserId)
        val wishes = wishService.getUserWishes(drawingId, user.id!!)
        return ResponseEntity.ok(wishes)
    }

    @GetMapping("/drawings/{drawingId}/my-allocations")
    @Operation(summary = "Get my allocations for a drawing")
    fun getMyAllocations(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestHeader("X-Test-User-Id", required = false) testUserId: String?
    ): ResponseEntity<List<CabinAllocationDTO>> {
        val user = getCurrentUser(jwt, testUserId)
        val drawing = drawingService.getDrawing(drawingId)

        if (drawing.status != DrawingStatus.PUBLISHED.name) {
            return ResponseEntity.ok(emptyList())
        }

        val allAllocations = drawingService.getAllocations(drawingId)
        val myAllocations = allAllocations.filter { it.userId == user.id }
        return ResponseEntity.ok(myAllocations)
    }

    @GetMapping("/drawings/{drawingId}/allocations")
    @Operation(summary = "Get all allocations (only if published)")
    fun getAllocations(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<List<CabinAllocationDTO>> {
        val drawing = drawingService.getDrawing(drawingId)

        // Only show all allocations if drawing is published
        if (drawing.status != DrawingStatus.PUBLISHED.name) {
            return ResponseEntity.status(403).build()
        }

        val allocations = drawingService.getAllocations(drawingId)
        return ResponseEntity.ok(allocations)
    }

    @GetMapping("/apartments")
    @Operation(summary = "Get all available apartments for lottery")
    fun getApartments(@AuthenticationPrincipal jwt: Jwt?): ResponseEntity<List<ApartmentDTO>> {
        // No authentication required for local dev - apartments are public info for lottery
        val apartments = bookingService.getAllApartments()
        return ResponseEntity.ok(apartments)
    }
}
