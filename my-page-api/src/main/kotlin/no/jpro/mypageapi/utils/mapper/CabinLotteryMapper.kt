package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.model.*
import org.springframework.stereotype.Service
import java.time.ZoneId

@Service
class CabinLotteryMapper(private val apartmentMapper: ApartmentMapper) {

    fun toCabinDrawingModel(dto: CabinDrawingDTO): CabinDrawing {
        return CabinDrawing(
            id = dto.id ?: java.util.UUID.randomUUID(),
            season = dto.season,
            status = CabinDrawing.Status.valueOf(dto.status),
            createdAt = dto.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            lockedAt = dto.lockedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            publishedAt = dto.publishedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            publishedExecutionId = dto.publishedExecutionId,
            publishedBy = dto.publishedBy,
            publishedByName = dto.publishedByName,
            periods = dto.periods.map { toCabinPeriodModel(it) },
            executions = dto.executions.map { toCabinDrawingExecutionModel(it) },
            bookingWarnings = dto.bookingWarnings
        )
    }

    fun toCabinPeriodModel(dto: CabinPeriodDTO): CabinPeriod {
        return CabinPeriod(
            id = dto.id ?: java.util.UUID.randomUUID(),
            startDate = dto.startDate,
            endDate = dto.endDate,
            description = dto.description,
            comment = dto.comment,
            sortOrder = dto.sortOrder
        )
    }

    fun toCabinWishModel(dto: CabinWishDTO): CabinWish {
        return CabinWish(
            id = dto.id ?: java.util.UUID.randomUUID(),
            userId = dto.userId,
            userName = dto.userName,
            userEmail = dto.userEmail,
            periodId = dto.periodId,
            periodDescription = dto.periodDescription,
            priority = dto.priority,
            desiredApartmentIds = dto.desiredApartmentIds,
            desiredApartmentNames = dto.desiredApartmentNames,
            comment = dto.comment
        )
    }

    fun toBulkCreateWishesDTO(model: BulkCreateWishes): BulkCreateWishesDTO {
        return BulkCreateWishesDTO(
            wishes = model.wishes?.map { wish ->
                CreateWishDTO(
                    periodId = wish.periodId,
                    priority = wish.priority,
                    desiredApartmentIds = wish.desiredApartmentIds,
                    comment = wish.comment
                )
            } ?: emptyList()
        )
    }

    fun toCabinAllocationModel(dto: CabinAllocationDTO): CabinAllocation {
        return CabinAllocation(
            id = dto.id ?: java.util.UUID.randomUUID(),
            periodId = dto.periodId,
            periodDescription = dto.periodDescription,
            startDate = dto.startDate,
            endDate = dto.endDate,
            apartmentId = dto.apartmentId,
            apartmentName = dto.apartmentName,
            apartmentSortOrder = dto.apartmentSortOrder,
            userId = dto.userId,
            userName = dto.userName,
            userEmail = dto.userEmail,
            allocationType = dto.allocationType,
            comment = dto.comment,
            allocatedAt = dto.allocatedAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    fun toCabinDrawingExecutionModel(dto: CabinDrawingExecutionDTO): CabinDrawingExecution {
        return CabinDrawingExecution(
            id = dto.id ?: java.util.UUID.randomUUID(),
            drawingId = dto.drawingId,
            executedAt = dto.executedAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            executedBy = dto.executedBy,
            executedByName = dto.executedByName,
            randomSeed = dto.randomSeed,
            auditLog = dto.auditLog,
            allocationCount = dto.allocationCount
        )
    }

    fun toCreateDrawingDTO(model: CreateAdminDrawingRequest): CreateDrawingDTO {
        return CreateDrawingDTO(
            season = model.season ?: throw IllegalArgumentException("Season is required")
        )
    }

    fun toCreatePeriodDTO(model: CreatePeriod): CreatePeriodDTO {
        return CreatePeriodDTO(
            startDate = model.startDate ?: throw IllegalArgumentException("Start date is required"),
            endDate = model.endDate ?: throw IllegalArgumentException("End date is required"),
            description = model.description ?: throw IllegalArgumentException("Description is required"),
            comment = model.comment,
            sortOrder = model.sortOrder ?: throw IllegalArgumentException("Sort order is required")
        )
    }

    fun toDrawingResultModel(dto: DrawingResultDTO): DrawingResult {
        return DrawingResult(
            drawingId = dto.drawingId,
            executionId = dto.executionId,
            season = dto.season,
            drawnAt = dto.drawnAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            allocations = dto.allocations.map { toCabinAllocationModel(it) },
            statistics = toDrawingStatisticsModel(dto.statistics),
            auditLog = dto.auditLog
        )
    }

    fun toDrawingStatisticsModel(dto: DrawingStatisticsDTO): DrawingStatistics {
        return DrawingStatistics(
            totalParticipants = dto.totalParticipants,
            participantsWithZeroAllocations = dto.participantsWithZeroAllocations,
            participantsWithOneAllocation = dto.participantsWithOneAllocation,
            participantsWithTwoAllocations = dto.participantsWithTwoAllocations,
            totalAllocations = dto.totalAllocations,
            allocationsPerPeriod = dto.allocationsPerPeriod
        )
    }
}