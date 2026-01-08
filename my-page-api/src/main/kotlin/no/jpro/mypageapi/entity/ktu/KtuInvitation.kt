package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "ktu_invitation")
data class KtuInvitation(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    val assignment: KtuAssignment,

    @Column(unique = true)
    val token: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: KtuInvitationStatus = KtuInvitationStatus.PENDING,

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
    val responses: List<KtuResponse> = emptyList()
)
