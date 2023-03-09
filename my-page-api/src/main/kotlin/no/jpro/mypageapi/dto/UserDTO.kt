package no.jpro.mypageapi.dto

import java.time.LocalDate

data class UserDTO(
    val email: String?,
    val name: String?,
    val givenName: String?,
    val familyName: String?,
    val icon: String? = null,
    val nickName: String? = null,
    val startDate: LocalDate? = null,
    val admin: Boolean = false,
    val employeeNumber: Int? = null,
    var budgets: List<BudgetDTO>? = null
)
