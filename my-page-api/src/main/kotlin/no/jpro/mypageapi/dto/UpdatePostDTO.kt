package no.jpro.mypageapi.dto

import java.time.LocalDate

data class UpdatePostDTO(
    val date: LocalDate? = null,
    val description: String? = null,
    val amount: Double? = null,
) {
}