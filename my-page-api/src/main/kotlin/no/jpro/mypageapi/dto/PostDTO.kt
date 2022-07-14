package no.jpro.mypageapi.dto

import java.time.LocalDate
import java.time.LocalDateTime

data class PostDTO(
    val id: Long?,
    val date: LocalDate,
    val description: String?,
    val amountIncludedMva: Double,
    val amountExcludedMva: Double,
    val documentNumber: String?,
    val dateOfPayment: LocalDate?,
    val dateOfDeduction: LocalDate?,
    val expense: Boolean,
    val locked: Boolean,
    val createdDate: LocalDateTime?,
    val lastModifiedDate: LocalDateTime?,
    val createdBy: String?
)
