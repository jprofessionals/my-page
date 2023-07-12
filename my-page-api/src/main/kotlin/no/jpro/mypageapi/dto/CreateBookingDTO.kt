package no.jpro.mypageapi.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.time.LocalDate

data class CreateBookingDTO(
    @field:NotNull
    @field:Positive
    @field:Schema(description = "Apartment ID", required = true)
    val apartmentId: Long,

    @field:NotNull
    @field:Schema(description = "Start date of the booking", required = true)
    val startDate: LocalDate,

    @field:NotNull
    @field:Schema(description = "End date of the booking", required = true)
    val endDate: LocalDate
)