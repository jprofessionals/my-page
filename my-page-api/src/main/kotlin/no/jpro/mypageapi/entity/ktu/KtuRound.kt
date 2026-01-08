package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import no.jpro.mypageapi.entity.User
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "ktu_round")
data class KtuRound(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false)
    val year: Int,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: KtuRoundStatus = KtuRoundStatus.DRAFT,

    @Column(name = "open_date")
    val openDate: LocalDate? = null,

    @Column(name = "close_date")
    val closeDate: LocalDate? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    val createdBy: User? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "round", fetch = FetchType.LAZY)
    val assignments: List<KtuAssignment> = emptyList(),

    // Appearance configuration
    @Column(name = "logo_url")
    val logoUrl: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_theme_id")
    val colorTheme: KtuColorTheme? = null,

    @Column(name = "intro_text", columnDefinition = "TEXT")
    val introText: String? = null,

    @Column(name = "instruction_text", columnDefinition = "TEXT")
    val instructionText: String? = null,

    @Column(name = "rating_label_low")
    val ratingLabelLow: String? = null,

    @Column(name = "rating_label_high")
    val ratingLabelHigh: String? = null,

    @Column(name = "thank_you_title")
    val thankYouTitle: String? = null,

    @Column(name = "thank_you_message", columnDefinition = "TEXT")
    val thankYouMessage: String? = null,

    @Column(name = "comment_field_label")
    val commentFieldLabel: String? = null,

    // Manual sent count for imported surveys (used when invitations aren't tracked individually)
    @Column(name = "manual_sent_count")
    val manualSentCount: Int? = null
)
