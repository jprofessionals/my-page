package no.jpro.mypageapi.entity.kti

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "kti_question")
data class KtiQuestion(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, unique = true)
    val code: String,

    @Column(name = "text_no", nullable = false, columnDefinition = "TEXT")
    val textNo: String,

    @Column(name = "text_en", columnDefinition = "TEXT")
    val textEn: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    val questionType: KtiQuestionType,

    @Column(nullable = false)
    val category: String,

    @Column(name = "display_order", nullable = false)
    val displayOrder: Int,

    @Column(nullable = false)
    val active: Boolean = true,

    @Column(nullable = false)
    val required: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
