package no.jpro.mypageapi.dto

import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

// Drawing DTOs
data class CabinDrawingDTO(
    val id: UUID?,
    val season: String,
    val status: String,
    val createdAt: LocalDateTime,
    val lockedAt: LocalDateTime?,
    val drawnAt: LocalDateTime?,
    val publishedAt: LocalDateTime?,
    val periods: List<CabinPeriodDTO> = emptyList()
)

data class CreateDrawingDTO(
    val season: String
)

// Period DTOs
data class CabinPeriodDTO(
    val id: UUID?,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val description: String,
    val comment: String?,
    val sortOrder: Int
)

data class CreatePeriodDTO(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val description: String,
    val comment: String? = null,
    val sortOrder: Int = 0
)

data class BulkCreatePeriodsDTO(
    val startDate: LocalDate,  // First Wednesday
    val endDate: LocalDate,    // Last Wednesday
    val descriptionTemplate: String? = null  // Optional template like "Uke {week}"
)

data class BulkCreatePeriodsResultDTO(
    val periodsCreated: Int,
    val periods: List<CabinPeriodDTO>
)

// Wish DTOs
data class CabinWishDTO(
    val id: UUID?,
    val userId: Long,
    val userName: String,
    val userEmail: String,
    val periodId: UUID,
    val periodDescription: String,
    val priority: Int,
    val desiredApartmentIds: List<Long>,
    val desiredApartmentNames: List<String>,
    val comment: String?
)

data class CreateWishDTO(
    val periodId: UUID,
    val priority: Int,
    val desiredApartmentIds: List<Long>,
    val comment: String? = null
)

data class BulkCreateWishesDTO(
    val wishes: List<CreateWishDTO>
)

// Allocation DTOs
data class CabinAllocationDTO(
    val id: UUID?,
    val periodId: UUID,
    val periodDescription: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val apartmentId: Long,
    val apartmentName: String,
    val userId: Long,
    val userName: String,
    val userEmail: String,
    val allocationType: String,
    val comment: String?,
    val allocatedAt: LocalDateTime
)

data class DrawingResultDTO(
    val drawingId: UUID,
    val season: String,
    val drawnAt: LocalDateTime,
    val allocations: List<CabinAllocationDTO>,
    val statistics: DrawingStatisticsDTO
)

data class DrawingStatisticsDTO(
    val totalParticipants: Int,
    val participantsWithZeroAllocations: Int,
    val participantsWithOneAllocation: Int,
    val participantsWithTwoAllocations: Int,
    val totalAllocations: Int,
    val allocationsPerPeriod: Map<String, Int>
)

// Import DTO for CSV import
data class ImportWishDTO(
    val email: String,
    val wishes: List<ImportWishItemDTO>
)

data class ImportWishItemDTO(
    val periodDescription: String,
    val apartmentNames: List<String>,
    val priority: Int,
    val comment: String? = null
)
