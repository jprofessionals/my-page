package no.jpro.mypageapi.entity

import jakarta.persistence.CascadeType
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
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "sales_activity")
class SalesActivity(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    var consultant: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    var customer: Customer? = null,

    @Column(name = "customer_name", length = 255)
    var customerName: String? = null,

    @Column(name = "supplier_name", length = 255)
    var supplierName: String? = null,

    @Column(nullable = false, length = 500)
    var title: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", nullable = false)
    var currentStage: SalesStage = SalesStage.INTERESTED,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ActivityStatus = ActivityStatus.ACTIVE,

    @Enumerated(EnumType.STRING)
    @Column(name = "closed_reason")
    var closedReason: ClosedReason? = null,

    @Column(name = "closed_reason_note", columnDefinition = "TEXT")
    var closedReasonNote: String? = null,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "max_price")
    var maxPrice: Int? = null,

    @Column(name = "offered_price")
    var offeredPrice: Int? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    var createdBy: User? = null,

    @Column(name = "closed_at")
    var closedAt: LocalDateTime? = null,

    @Column(name = "expected_start_date")
    var expectedStartDate: LocalDate? = null,

    @Column(name = "offer_deadline")
    var offerDeadline: LocalDateTime? = null,

    @Column(name = "offer_deadline_asap", nullable = false)
    var offerDeadlineAsap: Boolean = false,

    @Column(name = "deadline_reminder_sent")
    var deadlineReminderSent: Boolean = false,

    @Column(name = "interview_date")
    var interviewDate: LocalDateTime? = null,

    @OneToMany(mappedBy = "activity", cascade = [CascadeType.ALL], fetch = FetchType.LAZY, orphanRemoval = true)
    var stageHistory: MutableList<SalesStageHistory> = mutableListOf()

) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is SalesActivity) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
