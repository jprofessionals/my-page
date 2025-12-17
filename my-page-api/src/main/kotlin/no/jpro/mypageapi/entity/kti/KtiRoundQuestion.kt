package no.jpro.mypageapi.entity.kti

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "kti_round_question",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_kti_round_question_round_question",
            columnNames = ["round_id", "question_id"]
        )
    ]
)
data class KtiRoundQuestion(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    val round: KtiRound,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    val question: KtiQuestion,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
