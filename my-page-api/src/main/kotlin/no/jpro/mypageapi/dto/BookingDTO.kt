package no.jpro.mypageapi.dto

import java.time.LocalDate

data class BookingDTO (    //todo: make
    val id: Long? = null,
    val start_date: LocalDate,
    val end_date: LocalDate,
    val house_id: Long?,
    val employee_id: Long? = null,
)

