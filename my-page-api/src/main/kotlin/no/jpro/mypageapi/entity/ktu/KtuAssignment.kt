package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import no.jpro.mypageapi.entity.User
import java.time.LocalDateTime

@Entity
@Table(
    name = "ktu_assignment",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_ktu_assignment_round_consultant_contact",
            columnNames = ["round_id", "consultant_id", "contact_id"]
        )
    ]
)
data class KtuAssignment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    val round: KtuRound,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    val consultant: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id", nullable = false)
    val contact: KtuCustomerContact,

    @Column(columnDefinition = "TEXT")
    val notes: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    val createdBy: User? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "assignment", fetch = FetchType.LAZY)
    val invitations: List<KtuInvitation> = emptyList()
)
