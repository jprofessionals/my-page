package no.jpro.mypageapi.dto

import java.time.LocalDate

data class CreatePostDTO(
    val date: LocalDate,
    val description: String?,
    val amountIncMva: Double,
    val amountExMva: Double,
    val expense: Boolean,
)
