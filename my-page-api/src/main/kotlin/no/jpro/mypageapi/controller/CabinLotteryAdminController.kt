package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.service.*
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

@RestController
@RequestMapping("cabin-lottery/admin")
// @SecurityRequirement(name = "Bearer Authentication") // Commented for local dev - TODO: uncomment for production
@Tag(name = "Cabin Lottery Admin", description = "Admin endpoints for cabin lottery management")
class CabinLotteryAdminController(
    private val drawingService: CabinDrawingService,
    private val lotteryService: CabinLotteryService,
    private val wishService: CabinWishService,
    private val importService: CabinImportService,
    private val userRepository: UserRepository,
    private val allocationRepository: no.jpro.mypageapi.repository.CabinAllocationRepository,
    private val executionRepository: no.jpro.mypageapi.repository.CabinDrawingExecutionRepository,
    private val drawingRepository: no.jpro.mypageapi.repository.CabinDrawingRepository
) {
    
    // ===== Drawing Management =====
    
    @PostMapping("/drawings")
    @Operation(summary = "Create a new cabin drawing")
    fun createDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @RequestBody dto: CreateDrawingDTO
    ): ResponseEntity<CabinDrawingDTO> {
        requireAdmin(jwt)
        val result = drawingService.createDrawing(dto)
        return ResponseEntity.ok(result)
    }

    @GetMapping("/drawings")
    @Operation(summary = "Get all drawings")
    fun getAllDrawings(@AuthenticationPrincipal jwt: Jwt?): ResponseEntity<List<CabinDrawingDTO>> {
        requireAdmin(jwt)
        val drawings = drawingService.getAllDrawings()
        return ResponseEntity.ok(drawings)
    }

    @GetMapping("/drawings/{drawingId}")
    @Operation(summary = "Get drawing by ID")
    fun getDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<CabinDrawingDTO> {
        requireAdmin(jwt)
        val drawing = drawingService.getDrawing(drawingId)
        return ResponseEntity.ok(drawing)
    }

    @DeleteMapping("/drawings/{drawingId}")
    @Operation(summary = "Delete a drawing (only if not drawn or published)")
    fun deleteDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<Void> {
        requireAdmin(jwt)
        drawingService.deleteDrawing(drawingId)
        return ResponseEntity.noContent().build()
    }

    // ===== Period Management =====
    
    @PostMapping("/drawings/{drawingId}/periods")
    @Operation(summary = "Add a period to a drawing")
    fun addPeriod(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestBody dto: CreatePeriodDTO
    ): ResponseEntity<CabinPeriodDTO> {
        requireAdmin(jwt)
        val result = drawingService.addPeriod(drawingId, dto)
        return ResponseEntity.ok(result)
    }

    @GetMapping("/drawings/{drawingId}/periods")
    @Operation(summary = "Get all periods for a drawing")
    fun getPeriods(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<List<CabinPeriodDTO>> {
        requireAdmin(jwt)
        val periods = drawingService.getPeriods(drawingId)
        return ResponseEntity.ok(periods)
    }

    @PutMapping("/drawings/{drawingId}/periods/{periodId}")
    @Operation(summary = "Update a period")
    fun updatePeriod(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @PathVariable periodId: UUID,
        @RequestBody dto: CreatePeriodDTO
    ): ResponseEntity<CabinPeriodDTO> {
        requireAdmin(jwt)
        val result = drawingService.updatePeriod(drawingId, periodId, dto)
        return ResponseEntity.ok(result)
    }

    @DeleteMapping("/drawings/{drawingId}/periods/{periodId}")
    @Operation(summary = "Delete a period (only if drawing is OPEN)")
    fun deletePeriod(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @PathVariable periodId: UUID
    ): ResponseEntity<Void> {
        requireAdmin(jwt)
        drawingService.deletePeriod(drawingId, periodId)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/drawings/{drawingId}/periods/bulk")
    @Operation(summary = "Bulk create periods (Wednesday to Wednesday)")
    fun bulkCreatePeriods(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestBody dto: BulkCreatePeriodsDTO
    ): ResponseEntity<BulkCreatePeriodsResultDTO> {
        requireAdmin(jwt)
        val result = drawingService.bulkCreatePeriods(drawingId, dto)
        return ResponseEntity.ok(result)
    }

    // ===== Drawing Lifecycle =====

    @PostMapping("/drawings/{drawingId}/open")
    @Operation(summary = "Open a drawing (DRAFT -> OPEN, makes it visible to users)")
    fun openDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<CabinDrawingDTO> {
        requireAdmin(jwt)
        val result = drawingService.openDrawing(drawingId)
        return ResponseEntity.ok(result)
    }

    @PostMapping("/drawings/{drawingId}/revert-to-draft")
    @Operation(summary = "Revert drawing to DRAFT (OPEN/LOCKED -> DRAFT)")
    fun revertToDraft(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<CabinDrawingDTO> {
        requireAdmin(jwt)
        val result = drawingService.revertToDraft(drawingId)
        return ResponseEntity.ok(result)
    }

    @PostMapping("/drawings/{drawingId}/lock")
    @Operation(summary = "Lock a drawing (no more wish changes allowed)")
    fun lockDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<CabinDrawingDTO> {
        requireAdmin(jwt)
        val result = drawingService.lockDrawing(drawingId)
        return ResponseEntity.ok(result)
    }

    @PostMapping("/drawings/{drawingId}/unlock")
    @Operation(summary = "Unlock a drawing (allow wish changes again)")
    fun unlockDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<CabinDrawingDTO> {
        requireAdmin(jwt)
        val result = drawingService.unlockDrawing(drawingId)
        return ResponseEntity.ok(result)
    }

    @PostMapping("/drawings/{drawingId}/draw")
    @Operation(summary = "Perform the snake draft lottery")
    fun performDraw(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestParam(required = false) seed: Long?
    ): ResponseEntity<DrawingResultDTO> {
        requireAdmin(jwt)

        // Get user ID for audit trail
        val userId = if (jwt != null) {
            val userSub = jwt.subject
            val user = userRepository.findUserBySub(userSub)
                ?: throw IllegalArgumentException("User not found: $userSub")
            user.id ?: throw IllegalStateException("User has no ID")
        } else {
            // For local development without authentication, use a default test user ID
            1L
        }

        val result = lotteryService.performSnakeDraft(drawingId, userId, seed)
        return ResponseEntity.ok(result)
    }

    @PostMapping("/drawings/{drawingId}/publish")
    @Operation(summary = "Publish drawing results to users")
    fun publishDrawing(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestParam executionId: UUID
    ): ResponseEntity<CabinDrawingDTO> {
        requireAdmin(jwt)

        // Get user ID for audit trail
        val userId = if (jwt != null) {
            val userSub = jwt.subject
            val user = userRepository.findUserBySub(userSub)
                ?: throw IllegalArgumentException("User not found: $userSub")
            user.id ?: throw IllegalStateException("User has no ID")
        } else {
            // For local development without authentication, use a default test user ID
            1L
        }

        val result = drawingService.publishDrawing(drawingId, executionId, userId)
        return ResponseEntity.ok(result)
    }

    // ===== Wish Management =====

    @GetMapping("/drawings/{drawingId}/wishes")
    @Operation(summary = "Get all wishes for a drawing")
    fun getAllWishes(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<List<CabinWishDTO>> {
        requireAdmin(jwt)
        val wishes = wishService.getAllWishes(drawingId)
        return ResponseEntity.ok(wishes)
    }

    // ===== Allocation Management =====

    @GetMapping("/drawings/{drawingId}/allocations")
    @Operation(summary = "Get allocations for a drawing (published execution only if published)")
    fun getAllocations(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID
    ): ResponseEntity<List<CabinAllocationDTO>> {
        requireAdmin(jwt)

        // Get the drawing entity to check status and published execution
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        // If PUBLISHED, only return allocations from the published execution
        val allocations = if (drawing.publishedExecutionId != null) {
            val execution = executionRepository.findById(drawing.publishedExecutionId!!)
                .orElseThrow { IllegalArgumentException("Published execution not found") }

            allocationRepository.findByExecutionOrderByPeriodStartDateAscApartmentCabinNameAsc(execution)
                .map { allocation ->
                    CabinAllocationDTO(
                        id = allocation.id,
                        periodId = allocation.period.id!!,
                        periodDescription = allocation.period.description,
                        startDate = allocation.period.startDate,
                        endDate = allocation.period.endDate,
                        apartmentId = allocation.apartment.id!!,
                        apartmentName = allocation.apartment.cabin_name ?: "Unknown",
                        apartmentSortOrder = allocation.apartment.sort_order,
                        userId = allocation.user.id!!,
                        userName = allocation.user.name ?: "Unknown",
                        userEmail = allocation.user.email ?: "Unknown",
                        allocationType = allocation.allocationType.name,
                        comment = allocation.comment,
                        allocatedAt = allocation.allocatedAt
                    )
                }
        } else {
            // If not published, return all allocations (or could return empty list)
            drawingService.getAllocations(drawingId)
        }

        return ResponseEntity.ok(allocations)
    }

    // ===== Import =====

    @PostMapping("/drawings/{drawingId}/import", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Import wishes from CSV file (Google Forms format)")
    fun importWishes(
        @AuthenticationPrincipal jwt: Jwt?,
        @PathVariable drawingId: UUID,
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<ImportResultDTO> {
        requireAdmin(jwt)

        if (file.isEmpty) {
            return ResponseEntity.badRequest().build()
        }

        val result = importService.importWishesFromCSV(drawingId, file.inputStream)
        return ResponseEntity.ok(result)
    }

    private fun requireAdmin(jwt: Jwt?) {
        // For local development, allow admin access for all users
        // TODO: Re-enable admin check in production
        if (jwt == null) {
            return
        }

        val userSub = jwt.subject
        val user = userRepository.findUserBySub(userSub)
            ?: throw IllegalArgumentException("User not found: $userSub")

        // Skip admin check for local development
        // if (user.admin != true) {
        //     throw SecurityException("Admin access required")
        // }
    }
}
