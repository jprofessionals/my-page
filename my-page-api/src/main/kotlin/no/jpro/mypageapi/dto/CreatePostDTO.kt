package no.jpro.mypageapi.dto

import java.time.LocalDate

data class CreatePostDTO(
    val date: LocalDate,
    val description: String?,
    val amountIncludedMva: Double,
    val amountExcludedMva: Double,
    val expense: Boolean,
)
