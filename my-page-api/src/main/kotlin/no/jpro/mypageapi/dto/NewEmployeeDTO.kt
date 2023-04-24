package no.jpro.mypageapi.dto

import java.time.LocalDate

data class NewEmployeeDTO (
    val email: String,
    val employeeNumber: Int,
    val budgetStartDate: LocalDate
)