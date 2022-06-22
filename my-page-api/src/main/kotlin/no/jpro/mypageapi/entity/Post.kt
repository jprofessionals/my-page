package no.jpro.mypageapi.entity

import com.fasterxml.jackson.annotation.JsonIgnore
import java.time.LocalDate
import java.util.*
import javax.persistence.*

@Entity
@Table()
data class Post(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long,
    val date: LocalDate,
    val description: String?,
    val amount: Double,
    val expense: Boolean,
    @JsonIgnore
    @ManyToOne
    val budget: Budget
)