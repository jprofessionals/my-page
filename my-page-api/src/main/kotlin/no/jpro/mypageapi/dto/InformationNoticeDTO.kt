package no.jpro.mypageapi.dto

import java.time.LocalDate

data class InformationNoticeDTO(
    val id: Long? = null,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val description: String,
)