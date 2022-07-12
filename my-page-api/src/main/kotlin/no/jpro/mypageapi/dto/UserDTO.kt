package no.jpro.mypageapi.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import java.time.LocalDate

class UserDTO(
    val email: String?,
    val name: String?,
    val givenName: String?,
    val familyName: String?,
    val icon: String? = null,
    var nickName: String? = null,
    var startDate: LocalDate? = null,
    @JsonIgnore
    var budgets: List<BudgetDTO>? = null
)
