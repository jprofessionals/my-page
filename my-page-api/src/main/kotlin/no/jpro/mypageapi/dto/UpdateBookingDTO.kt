package no.jpro.mypageapi.dto

import java.time.LocalDate

data class UpdateBookingDTO (
    val startDate: LocalDate,
    val endDate: LocalDate,
    val apartmentID: Long
)
