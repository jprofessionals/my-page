package no.jpro.mypageapi.dto

import jakarta.validation.constraints.NotBlank

data class SubscriptionDTO(
    @field:NotBlank
    val tag: String,
)