package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.CabinLotteryApiDelegate
import no.jpro.mypageapi.dto.BulkCreatePeriodsDTO
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.model.*
import no.jpro.mypageapi.service.BookingService
import no.jpro.mypageapi.service.CabinDrawingService
import no.jpro.mypageapi.service.CabinLotteryService
import no.jpro.mypageapi.service.CabinWishService
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.AuthenticationHelper
import no.jpro.mypageapi.utils.mapper.ApartmentMapper
import no.jpro.mypageapi.utils.mapper.CabinLotteryMapper
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class CabinLotteryApiDelegateImpl(
    private val drawingService: CabinDrawingService,
    private val lotteryService: CabinLotteryService,
    private val wishService: CabinWishService,
    private val bookingService: BookingService,
    private val userService: UserService,
    private val cabinLotteryMapper: CabinLotteryMapper,
    private val apartmentMapper: ApartmentMapper,
    private val authHelper: AuthenticationHelper,
    private val request: Optional<NativeWebRequest>
) : CabinLotteryApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getCurrentDrawing(): ResponseEntity<CabinDrawing> {
        val drawingDTO = drawingService.getCurrentDrawingForUsers()
        return if (drawingDTO != null) {
            ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawingDTO))
        } else {
            ResponseEntity.ok(null)
        }
    }

    override fun getDrawing(drawingId: UUID): ResponseEntity<CabinDrawing> {
        val drawingDTO = drawingService.getDrawing(drawingId)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawingDTO))
    }

    override fun getDrawingPeriods(drawingId: UUID): ResponseEntity<List<CabinPeriod>> {
        val periods = drawingService.getPeriods(drawingId)
        return ResponseEntity.ok(periods.map { cabinLotteryMapper.toCabinPeriodModel(it) })
    }

    override fun submitWishes(drawingId: UUID, bulkCreateWishes: BulkCreateWishes): ResponseEntity<List<CabinWish>> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val user = authHelper.getCurrentUser(testUserId) ?: return ResponseEntity.status(401).build()

        if (user.id == null) {
            throw IllegalStateException("User ID cannot be null for user sub: ${user.sub}")
        }

        val bulkCreateWishesDTO = cabinLotteryMapper.toBulkCreateWishesDTO(bulkCreateWishes)
        val createdWishes = wishService.createWishes(drawingId, user, bulkCreateWishesDTO)
        return ResponseEntity.ok(createdWishes.map { cabinLotteryMapper.toCabinWishModel(it) })
    }

    override fun getMyWishes(drawingId: UUID): ResponseEntity<List<CabinWish>> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val user = authHelper.getCurrentUser(testUserId) ?: return ResponseEntity.status(401).build()
        val userId = user.id ?: throw IllegalStateException("User ID cannot be null for user sub: ${user.sub}")

        val wishes = wishService.getUserWishes(drawingId, userId)
        return ResponseEntity.ok(wishes.map { cabinLotteryMapper.toCabinWishModel(it) })
    }

    override fun getMyAllocations(drawingId: UUID): ResponseEntity<List<CabinAllocation>> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val user = authHelper.getCurrentUser(testUserId) ?: return ResponseEntity.status(401).build()
        val userId = user.id ?: throw IllegalStateException("User ID cannot be null for user sub: ${user.sub}")

        val allocations = drawingService.getAllocations(drawingId)
            .filter { it.userId == userId }
        return ResponseEntity.ok(allocations.map { cabinLotteryMapper.toCabinAllocationModel(it) })
    }

    override fun getDrawingAllocations(
        drawingId: UUID,
        executionId: UUID?
    ): ResponseEntity<List<CabinAllocation>> {
        val allocations = if (executionId != null) {
            // Get allocations from specific execution
            drawingService.getAllocationsForExecution(drawingId, executionId)
        } else {
            // Get allocations from published execution (if published) or latest execution
            drawingService.getAllocationsForDefaultExecution(drawingId)
        }
        return ResponseEntity.ok(allocations.map { cabinLotteryMapper.toCabinAllocationModel(it) })
    }

    override fun getLotteryApartments(): ResponseEntity<List<Apartment>> {
        val apartments = bookingService.getAllApartments()
        return ResponseEntity.ok(apartments.map { apartmentMapper.toApartmentModel(it) })
    }

    // ===== ADMIN ENDPOINTS =====

    override fun getAllDrawings(): ResponseEntity<List<CabinDrawing>> {
        val drawings = drawingService.getAllDrawings()
        return ResponseEntity.ok(drawings.map { cabinLotteryMapper.toCabinDrawingModel(it) })
    }

    override fun createAdminDrawing(createAdminDrawingRequest: CreateAdminDrawingRequest): ResponseEntity<CabinDrawing> {
        val createDrawingDTO = cabinLotteryMapper.toCreateDrawingDTO(createAdminDrawingRequest)
        val drawing = drawingService.createDrawing(createDrawingDTO)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun getAdminDrawing(drawingId: UUID): ResponseEntity<CabinDrawing> {
        val drawing = drawingService.getDrawing(drawingId)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun deleteDrawing(drawingId: UUID): ResponseEntity<Unit> {
        drawingService.deleteDrawing(drawingId)
        return ResponseEntity.noContent().build()
    }

    override fun createPeriod(drawingId: UUID, createPeriod: CreatePeriod): ResponseEntity<CabinPeriod> {
        val createPeriodDTO = cabinLotteryMapper.toCreatePeriodDTO(createPeriod)
        val period = drawingService.addPeriod(drawingId, createPeriodDTO)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinPeriodModel(period))
    }

    override fun getAdminPeriods(drawingId: UUID): ResponseEntity<List<CabinPeriod>> {
        val periods = drawingService.getPeriods(drawingId)
        return ResponseEntity.ok(periods.map { cabinLotteryMapper.toCabinPeriodModel(it) })
    }

    override fun updatePeriod(drawingId: UUID, periodId: UUID, createPeriod: CreatePeriod): ResponseEntity<CabinPeriod> {
        val updatePeriodDTO = cabinLotteryMapper.toCreatePeriodDTO(createPeriod)
        val period = drawingService.updatePeriod(drawingId, periodId, updatePeriodDTO)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinPeriodModel(period))
    }

    override fun deletePeriod(drawingId: UUID, periodId: UUID): ResponseEntity<Unit> {
        drawingService.deletePeriod(drawingId, periodId)
        return ResponseEntity.noContent().build()
    }

    override fun bulkCreatePeriods(drawingId: UUID, bulkCreatePeriodsRequest: BulkCreatePeriodsRequest): ResponseEntity<BulkCreatePeriods200Response> {
        val dto = BulkCreatePeriodsDTO(
            startDate = bulkCreatePeriodsRequest.startDate!!,
            endDate = bulkCreatePeriodsRequest.endDate!!
        )
        val result = drawingService.bulkCreatePeriods(drawingId, dto)
        val response = BulkCreatePeriods200Response(
            periodsCreated = result.periodsCreated,
            periods = result.periods.map { cabinLotteryMapper.toCabinPeriodModel(it) }
        )
        return ResponseEntity.ok(response)
    }

    override fun lockDrawing(drawingId: UUID): ResponseEntity<CabinDrawing> {
        val drawing = drawingService.lockDrawing(drawingId)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun unlockDrawing(drawingId: UUID): ResponseEntity<CabinDrawing> {
        val drawing = drawingService.unlockDrawing(drawingId)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun openDrawing(drawingId: UUID): ResponseEntity<CabinDrawing> {
        val drawing = drawingService.openDrawing(drawingId)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun revertToDraft(drawingId: UUID): ResponseEntity<CabinDrawing> {
        val drawing = drawingService.revertToDraft(drawingId)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun revertToLocked(drawingId: UUID): ResponseEntity<CabinDrawing> {
        val drawing = drawingService.revertToLocked(drawingId)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun performDrawing(drawingId: UUID, seed: Long?): ResponseEntity<DrawingResult> {
        // Get authenticated user (admin performing the drawing)
        val user = authHelper.getCurrentUser()
        val executedBy = user?.id ?: 0L // Default to 0 if not authenticated (for testing)

        // Perform the snake draft drawing
        val resultDTO = lotteryService.performSnakeDraft(drawingId, executedBy, seed)

        // Map to API model and return
        return ResponseEntity.ok(cabinLotteryMapper.toDrawingResultModel(resultDTO))
    }

    override fun publishDrawing(drawingId: UUID, executionId: UUID): ResponseEntity<CabinDrawing> {
        // Get authenticated user (admin publishing the drawing)
        val user = authHelper.getCurrentUser()
        val publishedBy = user?.id ?: throw IllegalStateException("User must be authenticated to publish drawing")

        val drawing = drawingService.publishDrawing(drawingId, executionId, publishedBy)
        return ResponseEntity.ok(cabinLotteryMapper.toCabinDrawingModel(drawing))
    }

    override fun getAllWishes(drawingId: UUID): ResponseEntity<List<CabinWish>> {
        val wishes = wishService.getAllWishes(drawingId)
        return ResponseEntity.ok(wishes.map { cabinLotteryMapper.toCabinWishModel(it) })
    }

    override fun getAdminAllocations(drawingId: UUID, executionId: UUID?): ResponseEntity<List<CabinAllocation>> {
        val allocations = if (executionId != null) {
            // Get allocations from specific execution
            drawingService.getAllocationsForExecution(drawingId, executionId)
        } else {
            // Get allocations from published execution (if published) or latest execution
            drawingService.getAllocationsForDefaultExecution(drawingId)
        }
        return ResponseEntity.ok(allocations.map { cabinLotteryMapper.toCabinAllocationModel(it) })
    }

    override fun importWishes(drawingId: UUID, file: org.springframework.web.multipart.MultipartFile): ResponseEntity<ImportWishes200Response> {
        // TODO: Implement wish import from file
        return ResponseEntity.status(501).build()
    }

    override fun deleteExecution(drawingId: UUID, executionId: UUID): ResponseEntity<Unit> {
        drawingService.deleteExecution(drawingId, executionId)
        return ResponseEntity.noContent().build()
    }
}