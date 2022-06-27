package no.jpro.mypageapi.dto

import java.time.LocalDate


class PostDTO(
    val date: LocalDate,
    val description: String?,
    val amount: Double,
    val expense: Boolean,
)