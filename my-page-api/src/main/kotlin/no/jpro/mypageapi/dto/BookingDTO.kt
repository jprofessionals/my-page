package no.jpro.mypageapi.dto

import no.jpro.mypageapi.entity.Apartment
import java.time.LocalDate

data class BookingDTO(
    val id: Long? = null,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val apartment: Apartment?,
    val employeeName: String?
)



