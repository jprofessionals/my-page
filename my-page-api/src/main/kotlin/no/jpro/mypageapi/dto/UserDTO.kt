package no.jpro.mypageapi.dto

import com.fasterxml.jackson.annotation.JsonIgnore
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
    @JsonIgnore
    val budgets: List<BudgetDTO>? = null
)
