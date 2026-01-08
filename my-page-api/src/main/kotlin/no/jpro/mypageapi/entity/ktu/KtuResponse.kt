package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "ktu_response",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_ktu_response_invitation_question",
            columnNames = ["invitation_id", "question_id"]
        )
    ]
)
data class KtuResponse(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id", nullable = false)
    val invitation: KtuInvitation,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    val question: KtuQuestion,

    @Column(name = "rating_value")
    val ratingValue: Int? = null,

    @Column(name = "text_value", columnDefinition = "TEXT")
    val textValue: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
