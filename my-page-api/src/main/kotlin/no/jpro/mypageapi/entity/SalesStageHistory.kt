package no.jpro.mypageapi.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "sales_stage_history")
class SalesStageHistory(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    var activity: SalesActivity,

    @Enumerated(EnumType.STRING)
    @Column(name = "from_stage")
    var fromStage: SalesStage? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "to_stage", nullable = false)
    var toStage: SalesStage,

    @Column(name = "changed_at", nullable = false)
    var changedAt: LocalDateTime = LocalDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    var changedBy: User? = null,

    @Column(name = "days_in_previous_stage")
    var daysInPreviousStage: Int? = null

) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SalesStageHistory) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
