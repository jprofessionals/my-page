package no.jpro.mypageapi.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "yearly_consultant_capacity")
class YearlyConsultantCapacity(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true)
    val year: Int,

    @Column(name = "total_available_weeks", nullable = false)
    val totalAvailableWeeks: Double
)
