package no.jpro.mypageapi.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import java.time.LocalDate

data class NewEmployeeDTO (
    @field:Email
    @field:NotBlank
    val email: String,
    val employeeNumber: Int,
    val budgetStartDate: LocalDate
)