package no.jpro.mypageapi.entity

import com.fasterxml.jackson.annotation.JsonIgnore
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDateTime
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id
import javax.persistence.ManyToOne

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
    val createdBy: String?
)
