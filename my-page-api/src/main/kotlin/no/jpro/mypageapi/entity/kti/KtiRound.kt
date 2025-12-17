package no.jpro.mypageapi.entity.kti

import jakarta.persistence.*
import no.jpro.mypageapi.entity.User
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "kti_round")
data class KtiRound(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false)
    val year: Int,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: KtiRoundStatus = KtiRoundStatus.DRAFT,

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
    val assignments: List<KtiAssignment> = emptyList()
)
