package no.jpro.mypageapi.entity.kti

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "kti_response",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_kti_response_invitation_question",
            columnNames = ["invitation_id", "question_id"]
        )
    ]
)
data class KtiResponse(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id", nullable = false)
    val invitation: KtiInvitation,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    val question: KtiQuestion,

    @Column(name = "rating_value")
    val ratingValue: Int? = null,

    @Column(name = "text_value", columnDefinition = "TEXT")
    val textValue: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
