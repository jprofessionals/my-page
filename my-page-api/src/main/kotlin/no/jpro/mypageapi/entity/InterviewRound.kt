package no.jpro.mypageapi.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "interview_round")
class InterviewRound(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    var activity: SalesActivity,

    @Column(name = "round_number", nullable = false)
    var roundNumber: Int = 1,

    @Column(name = "interview_date")
    var interviewDate: LocalDateTime? = null,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()

) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is InterviewRound) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
