package no.jpro.mypageapi.entity

import com.fasterxml.jackson.annotation.JsonIgnore
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
data class Hours(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val hours: Double,
    @CreationTimestamp
    val createdDate: LocalDateTime? = null,
    @JsonIgnore
    @ManyToOne
    val budget: Budget? = null,
    val createdBy: String?,
    val dateOfUsage: LocalDate
)
