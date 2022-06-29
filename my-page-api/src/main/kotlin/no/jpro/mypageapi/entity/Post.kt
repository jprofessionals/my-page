package no.jpro.mypageapi.entity

import com.fasterxml.jackson.annotation.JsonIgnore
import java.time.LocalDate
import javax.persistence.*

@Entity
data class Post(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val date: LocalDate,
    val description: String?,
    val amount: Double,
    val expense: Boolean,
    @JsonIgnore
    @ManyToOne
    var budget: Budget? = null
)