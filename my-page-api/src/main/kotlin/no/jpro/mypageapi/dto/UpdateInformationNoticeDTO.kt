package no.jpro.mypageapi.dto

import java.time.LocalDate

data class UpdateInformationNoticeDTO (
    val startDate: LocalDate,
    val endDate: LocalDate,
    val description: String,
)