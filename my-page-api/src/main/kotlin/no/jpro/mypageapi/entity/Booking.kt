package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDate

@Entity
data class Booking (
    //todo: make
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val start_date: LocalDate,
    val end_date: LocalDate,
    val house_id: Long?,
    val employee_id: Long?,
)