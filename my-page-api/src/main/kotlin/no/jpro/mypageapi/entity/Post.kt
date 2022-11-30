package no.jpro.mypageapi.entity

import com.fasterxml.jackson.annotation.JsonIgnore
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDate
import java.time.LocalDateTime


@Entity
data class Post(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val date: LocalDate,
    val description: String?,
    val amountIncMva: Double?,
    val amountExMva: Double?,
    val expense: Boolean,
    val locked: Boolean = false,
    val documentNumber: String? = null,
    val dateOfPayment: LocalDate? = null,
    val dateOfDeduction: LocalDate? = null,
    @CreationTimestamp
    val createdDate: LocalDateTime? = null,
    @UpdateTimestamp
    val lastModifiedDate: LocalDateTime? = null,
    @JsonIgnore
    @ManyToOne
    val budget: Budget? = null,
    @ManyToOne
    val createdBy: User? = null
)
