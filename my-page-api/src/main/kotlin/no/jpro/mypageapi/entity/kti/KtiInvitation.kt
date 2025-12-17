package no.jpro.mypageapi.entity.kti

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "kti_invitation")
data class KtiInvitation(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    val assignment: KtiAssignment,

    @Column(unique = true)
    val token: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: KtiInvitationStatus = KtiInvitationStatus.PENDING,

    @Column(name = "sent_at")
    val sentAt: LocalDateTime? = null,

    @Column(name = "opened_at")
    val openedAt: LocalDateTime? = null,

    @Column(name = "responded_at")
    val respondedAt: LocalDateTime? = null,

    @Column(name = "reminder_count", nullable = false)
    val reminderCount: Int = 0,

    @Column(name = "expires_at")
    val expiresAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "invitation", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    val responses: List<KtiResponse> = emptyList()
)
