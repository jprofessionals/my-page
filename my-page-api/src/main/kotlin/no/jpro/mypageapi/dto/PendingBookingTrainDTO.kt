package no.jpro.mypageapi.dto

import no.jpro.mypageapi.entity.Apartment
import java.time.LocalDate
import java.util.UUID

data class PendingBookingTrainDTO (
    val id: String = UUID.randomUUID().toString(),
    val apartment: Apartment,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val pendingBookingList: List<PendingBookingDTO>
)