package no.jpro.mypageapi.dto

import java.time.LocalDate
import java.util.UUID

data class DrawingPeriodDTO(
    val id: String = UUID.randomUUID().toString(),
    val startDate: LocalDate,
    val endDate: LocalDate,
    val drawingDate: LocalDate?,
    val pendingBookings: List<PendingBookingDTO>
)
