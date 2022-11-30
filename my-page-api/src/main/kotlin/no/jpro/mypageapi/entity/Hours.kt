package no.jpro.mypageapi.entity

import com.fasterxml.jackson.annotation.JsonIgnore
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
data class Hours(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val hours: Int,
    @CreationTimestamp
    val createdDate: LocalDateTime? = null,
    @JsonIgnore
    @ManyToOne
    val budget: Budget? = null,
    val createdBy: String?,
    val dateOfUsage: LocalDate
)
