package no.jpro.mypageapi.dto

import java.time.LocalDate

data class CreateBudgetDTO(
    val budgetTypeId: Long,
    val startDate: LocalDate,
    val startAmount: Double,
    val allowTimeBalance: Boolean?
)
