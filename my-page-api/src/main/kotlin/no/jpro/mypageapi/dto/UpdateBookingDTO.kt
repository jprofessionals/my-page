package no.jpro.mypageapi.dto

import java.time.LocalDate

data class UpdateBookingDTO (
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
)