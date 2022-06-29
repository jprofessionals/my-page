package no.jpro.mypageapi.dto

import java.time.LocalDate

class UserDTO(
    val email: String?,
    val name: String?,
    val givenName: String?,
    val familyName: String?,
    val icon: String?,
    var nickName: String? = null,
    var startDate: LocalDate?= null,
    var budgets: List<BudgetDTO>? = null

)
