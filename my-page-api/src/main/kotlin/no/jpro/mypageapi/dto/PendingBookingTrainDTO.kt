package no.jpro.mypageapi.dto

import java.time.LocalDate
import java.util.UUID

data class PendingBookingTrainDTO (
    val id: String = UUID.randomUUID().toString(),
    val apartmentId: Long,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val pendingBookingList: List<PendingBookingDTO>,
    val drawingPeriodList: List<DrawingPeriodDTO>
)