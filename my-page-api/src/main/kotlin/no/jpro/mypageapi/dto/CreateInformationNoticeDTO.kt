package no.jpro.mypageapi.dto

import java.time.LocalDate

data class CreateInformationNoticeDTO (
    val startDate: LocalDate,
    val endDate: LocalDate,
    val description: String,
)
