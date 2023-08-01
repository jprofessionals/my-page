package no.jpro.mypageapi.dto

import no.jpro.mypageapi.entity.Apartment
import java.time.LocalDate

data class  PendingBookingDTO (
    val id: Long? = null,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val apartment: Apartment?,
    val employeeName: String?,
    val createdDate: LocalDate
)