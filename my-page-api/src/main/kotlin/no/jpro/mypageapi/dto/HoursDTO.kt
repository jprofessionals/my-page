package no.jpro.mypageapi.dto

import java.time.LocalDate

data class HoursDTO (
        val id: Long?,
        val hours: Int,
        val createdBy: String,
        val dateOfUsage: LocalDate
        )