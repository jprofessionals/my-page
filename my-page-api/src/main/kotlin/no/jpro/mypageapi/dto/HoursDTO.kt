package no.jpro.mypageapi.dto

import java.time.LocalDate

data class HoursDTO (
        val id: Long?,
        val hours: Double,
        val createdBy: String,
        val dateOfUsage: LocalDate
        )
