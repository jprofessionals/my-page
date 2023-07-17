package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDate

@Entity
data class Booking(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val startDate: LocalDate,
    val endDate: LocalDate,
    @ManyToOne
    @JoinColumn(name = "apartment_id", referencedColumnName = "id")
    val apartment: Apartment? = null,
    @ManyToOne
    @JoinColumn(name = "employee_id", referencedColumnName = "id")
    val employee: User? = null,
)
