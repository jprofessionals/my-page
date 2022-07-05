package no.jpro.mypageapi.dto

import java.time.LocalDate


data class CreateBudgetDTO(
    val name: String,
    val ageOfBudgetInMonths: Long,
    val budgetTypeId: Long,
    val startDate: LocalDate
)
