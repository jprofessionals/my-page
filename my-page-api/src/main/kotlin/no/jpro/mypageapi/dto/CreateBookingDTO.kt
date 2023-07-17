package no.jpro.mypageapi.dto

import java.time.LocalDate

data class CreateBookingDTO(
    val apartmentID: Long,
    val startDate: LocalDate,
    val endDate: LocalDate
)