package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "ktu_round_question",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_ktu_round_question_round_question",
            columnNames = ["round_id", "question_id"]
        )
    ]
)
data class KtuRoundQuestion(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    val round: KtuRound,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    val question: KtuQuestion,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "comment_field_label")
    var commentFieldLabel: String? = null,

    @Column(name = "custom_text_no", length = 500)
    var customTextNo: String? = null,

    /**
     * Override for required field. If null, uses question.required.
     * Allows admin to make a normally required question optional for a specific round.
     */
    @Column(name = "required_override")
    var requiredOverride: Boolean? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
