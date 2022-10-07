package no.jpro.mypageapi.dto

import java.time.LocalDate

data class CreateHoursDTO (
    val hoursUsed: Int,
    val dateOfUsage: LocalDate = LocalDate.now()
    )