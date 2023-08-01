package no.jpro.mypageapi.dto

import java.time.LocalDate

data class CreatePendingBookingDTO(
    val apartmentID: Long,
    val startDate: LocalDate,
    val endDate: LocalDate
)