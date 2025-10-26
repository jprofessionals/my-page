package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.repository.*
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.context.annotation.Lazy
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
class CabinDrawingService(
    private val drawingRepository: CabinDrawingRepository,
    private val periodRepository: CabinPeriodRepository,
    private val allocationRepository: CabinAllocationRepository,
    private val executionRepository: CabinDrawingExecutionRepository,
    private val userRepository: UserRepository,
    @Lazy private val bookingIntegrationService: CabinBookingIntegrationService
) {
    
    @Transactional
    fun createDrawing(dto: CreateDrawingDTO): CabinDrawingDTO {
        val updatedDrawing = CabinDrawing(
            season = dto.season,
            status = DrawingStatus.DRAFT,
            createdAt = LocalDateTime.now()
        )
        val saved = drawingRepository.save(updatedDrawing)
        return toDTO(saved)
    }
    
    @Transactional
    fun addPeriod(drawingId: UUID, dto: CreatePeriodDTO): CabinPeriodDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.DRAFT && drawing.status != DrawingStatus.OPEN) {
            throw IllegalStateException("Cannot add periods to a locked or completed drawing. Current status: ${drawing.status}")
        }

        val period = CabinPeriod(
            drawing = drawing,
            startDate = dto.startDate,
            endDate = dto.endDate,
            description = dto.description,
            comment = dto.comment,
            sortOrder = dto.sortOrder
        )
        val saved = periodRepository.save(period)
        return toDTO(saved)
    }

    @Transactional
    fun bulkCreatePeriods(drawingId: UUID, dto: BulkCreatePeriodsDTO): BulkCreatePeriodsResultDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.DRAFT && drawing.status != DrawingStatus.OPEN) {
            throw IllegalStateException("Cannot add periods to a locked or completed drawing. Current status: ${drawing.status}")
        }

        // Get current max sortOrder
        val existingPeriods = periodRepository.findByDrawingOrderBySortOrder(drawing)
        var sortOrder = if (existingPeriods.isNotEmpty()) existingPeriods.maxOf { it.sortOrder } + 1 else 1

        val periods = mutableListOf<CabinPeriod>()
        var currentStart = dto.startDate

        while (currentStart.isBefore(dto.endDate) || currentStart.isEqual(dto.endDate)) {
            val currentEnd = currentStart.plusWeeks(1)

            // Generate description: "DD.MM - DD.MM"
            val description = "${currentStart.dayOfMonth.toString().padStart(2, '0')}.${currentStart.monthValue.toString().padStart(2, '0')} - " +
                             "${currentEnd.dayOfMonth.toString().padStart(2, '0')}.${currentEnd.monthValue.toString().padStart(2, '0')}"

            val period = CabinPeriod(
                drawing = drawing,
                startDate = currentStart,
                endDate = currentEnd,
                description = description,
                sortOrder = sortOrder++
            )
            periods.add(period)

            currentStart = currentEnd
        }

        val savedPeriods = periodRepository.saveAll(periods)

        return BulkCreatePeriodsResultDTO(
            periodsCreated = savedPeriods.size,
            periods = savedPeriods.map { toDTO(it) }
        )
    }

    @Transactional
    fun updatePeriod(drawingId: UUID, periodId: UUID, dto: CreatePeriodDTO): CabinPeriodDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.DRAFT && drawing.status != DrawingStatus.OPEN) {
            throw IllegalStateException("Cannot update periods in a locked or completed drawing. Current status: ${drawing.status}")
        }

        val period = periodRepository.findById(periodId)
            .orElseThrow { IllegalArgumentException("Period not found: $periodId") }

        if (period.drawing.id != drawingId) {
            throw IllegalArgumentException("Period does not belong to this drawing")
        }

        period.startDate = dto.startDate
        period.endDate = dto.endDate
        period.description = dto.description
        period.comment = dto.comment
        period.sortOrder = dto.sortOrder

        val saved = periodRepository.save(period)
        return toDTO(saved)
    }

    @Transactional
    fun deletePeriod(drawingId: UUID, periodId: UUID) {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.DRAFT && drawing.status != DrawingStatus.OPEN) {
            throw IllegalStateException("Cannot delete periods from a locked or completed drawing. Current status: ${drawing.status}")
        }

        val period = periodRepository.findById(periodId)
            .orElseThrow { IllegalArgumentException("Period not found: $periodId") }

        if (period.drawing.id != drawingId) {
            throw IllegalArgumentException("Period does not belong to this drawing")
        }

        periodRepository.delete(period)
    }

    @Transactional
    fun openDrawing(drawingId: UUID): CabinDrawingDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.DRAFT) {
            throw IllegalStateException("Can only open a draft drawing. Current status: ${drawing.status}")
        }

        val updatedDrawing = drawing.copy(status = DrawingStatus.OPEN)
        val saved = drawingRepository.save(updatedDrawing)
        return toDTO(saved)
    }

    @Transactional
    fun lockDrawing(drawingId: UUID): CabinDrawingDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.OPEN) {
            throw IllegalStateException("Can only lock an open drawing. Current status: ${drawing.status}")
        }

        val updatedDrawing = drawing.copy(status = DrawingStatus.LOCKED, lockedAt = LocalDateTime.now())
        val saved = drawingRepository.save(updatedDrawing)
        return toDTO(saved)
    }

    @Transactional
    fun unlockDrawing(drawingId: UUID): CabinDrawingDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.LOCKED) {
            throw IllegalStateException("Can only unlock a locked drawing. Current status: ${drawing.status}")
        }

        val updatedDrawing = drawing.copy(status = DrawingStatus.OPEN, lockedAt = null)
        val saved = drawingRepository.save(updatedDrawing)
        return toDTO(saved)
    }

    @Transactional
    fun revertToDraft(drawingId: UUID): CabinDrawingDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.OPEN && drawing.status != DrawingStatus.LOCKED) {
            throw IllegalStateException("Can only revert OPEN or LOCKED drawings to DRAFT. Current status: ${drawing.status}")
        }

        val updatedDrawing = drawing.copy(status = DrawingStatus.DRAFT, lockedAt = null)
        val saved = drawingRepository.save(updatedDrawing)
        return toDTO(saved)
    }

    @Transactional
    fun deleteDrawing(drawingId: UUID) {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status == DrawingStatus.DRAWN || drawing.status == DrawingStatus.PUBLISHED) {
            throw IllegalStateException("Cannot delete a drawing that has been drawn or published. Current status: ${drawing.status}")
        }

        // Can delete: DRAFT, OPEN, LOCKED

        // Delete all related periods first (cascade should handle this, but being explicit)
        periodRepository.deleteAll(periodRepository.findByDrawingOrderBySortOrder(drawing))

        // Delete the drawing
        drawingRepository.delete(drawing)
    }

    @Transactional
    fun publishDrawing(drawingId: UUID, executionId: UUID, publishedBy: Long): CabinDrawingDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        // Validate that drawing must be DRAWN before publishing
        if (drawing.status != DrawingStatus.DRAWN) {
            throw IllegalStateException("Drawing must be drawn before publishing. Current status: ${drawing.status}")
        }

        // Validate that the execution exists and belongs to this drawing
        val execution = executionRepository.findById(executionId)
            .orElseThrow { IllegalArgumentException("Execution not found: $executionId") }

        if (execution.drawing.id != drawingId) {
            throw IllegalArgumentException("Execution does not belong to this drawing")
        }

        // Validate that no execution has been published yet
        if (drawing.publishedExecutionId != null) {
            throw IllegalStateException("An execution has already been published for this drawing")
        }

        drawing.status = DrawingStatus.PUBLISHED
        drawing.publishedAt = LocalDateTime.now()
        drawing.publishedExecutionId = executionId
        drawing.publishedBy = publishedBy

        val saved = drawingRepository.save(drawing)

        bookingIntegrationService.createBookingsFromAllocations(drawingId)

        return toDTO(saved)
    }
    
    fun getDrawing(drawingId: UUID): CabinDrawingDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }
        return toDTO(drawing)
    }
    
    fun getAllDrawings(): List<CabinDrawingDTO> {
        return drawingRepository.findAll().map { toDTO(it) }
    }
    
    fun getDrawingsBySeason(season: String): List<CabinDrawingDTO> {
        return drawingRepository.findBySeasonOrderByCreatedAtDesc(season).map { toDTO(it) }
    }
    
    fun getCurrentDrawing(): CabinDrawingDTO? {
        return drawingRepository.findTopByOrderByCreatedAtDesc()?.let { toDTO(it) }
    }

    fun getCurrentDrawingForUsers(): CabinDrawingDTO? {
        // Brukere skal kun se trekninger som er OPEN, LOCKED, DRAWN eller PUBLISHED
        // DRAFT er kun for admin
        // Henter den nyeste trekningen som IKKE er DRAFT
        val drawing = drawingRepository.findTopByStatusNotOrderByCreatedAtDesc(DrawingStatus.DRAFT)
        return drawing?.let { toDTO(it) }
    }
    
    fun getPeriods(drawingId: UUID): List<CabinPeriodDTO> {
        return periodRepository.findByDrawingIdOrderBySortOrder(drawingId).map { toDTO(it) }
    }
    
    fun getAllocations(drawingId: UUID): List<CabinAllocationDTO> {
        val allocations = allocationRepository.findByDrawingIdOrderByPeriodStartDateAsc(drawingId)
        return allocations.map { allocation ->
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
    }
    
    private fun toDTO(drawing: CabinDrawing): CabinDrawingDTO {
        val periods = periodRepository.findByDrawingOrderBySortOrder(drawing)

        // Populate executions
        val executions = executionRepository.findByDrawingOrderByExecutedAtDesc(drawing).map { execution ->
            toDTO(execution)
        }

        // Get publishedBy user name
        val publishedByName = drawing.publishedBy?.let { userId ->
            userRepository.findById(userId.toString()).orElse(null)?.name
        }

        return CabinDrawingDTO(
            id = drawing.id,
            season = drawing.season,
            status = drawing.status.name,
            createdAt = drawing.createdAt,
            lockedAt = drawing.lockedAt,
            publishedAt = drawing.publishedAt,
            publishedExecutionId = drawing.publishedExecutionId,
            publishedBy = drawing.publishedBy,
            publishedByName = publishedByName,
            periods = periods.map { toDTO(it) },
            executions = executions
        )
    }

    private fun toDTO(execution: CabinDrawingExecution): CabinDrawingExecutionDTO {
        // Parse audit log from JSON
        val objectMapper = ObjectMapper()
        val auditLog: List<String>? = try {
            execution.auditLog?.let { objectMapper.readValue(it) }
        } catch (e: Exception) {
            null
        }

        // Get executed by user name
        val executedByName = userRepository.findById(execution.executedBy.toString()).orElse(null)?.name

        // Count allocations for this execution
        val allocationCount = allocationRepository.countByExecution(execution)

        return CabinDrawingExecutionDTO(
            id = execution.id,
            drawingId = execution.drawing.id!!,
            executedAt = execution.executedAt,
            executedBy = execution.executedBy,
            executedByName = executedByName,
            randomSeed = execution.randomSeed,
            auditLog = auditLog,
            allocationCount = allocationCount
        )
    }
    
    private fun toDTO(period: CabinPeriod): CabinPeriodDTO {
        return CabinPeriodDTO(
            id = period.id,
            startDate = period.startDate,
            endDate = period.endDate,
            description = period.description,
            comment = period.comment,
            sortOrder = period.sortOrder
        )
    }
}
