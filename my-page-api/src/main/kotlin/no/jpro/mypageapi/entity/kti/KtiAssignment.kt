package no.jpro.mypageapi.entity.kti

import jakarta.persistence.*
import no.jpro.mypageapi.entity.User
import java.time.LocalDateTime

@Entity
@Table(
    name = "kti_assignment",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_kti_assignment_round_consultant_contact",
            columnNames = ["round_id", "consultant_id", "contact_id"]
        )
    ]
)
data class KtiAssignment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    val round: KtiRound,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    val consultant: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id", nullable = false)
    val contact: KtiCustomerContact,

    @Column(columnDefinition = "TEXT")
    val notes: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    val createdBy: User? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "assignment", fetch = FetchType.LAZY)
    val invitations: List<KtiInvitation> = emptyList()
)
