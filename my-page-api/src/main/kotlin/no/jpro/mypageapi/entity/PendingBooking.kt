package no.jpro.mypageapi.entity

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import java.time.LocalDate

@Entity
data class PendingBooking(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val startDate: LocalDate,
    val endDate: LocalDate,
    @ManyToOne
    @JoinColumn(name = "apartment_id", referencedColumnName = "id")
    val apartment: Apartment,
    @ManyToOne
    @JoinColumn(name = "employee_id", referencedColumnName = "id")
    val employee: User? = null,
    val createdDate: LocalDate = LocalDate.now()
)
