package no.jpro.mypageapi.entity

import jakarta.persistence.*
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.User
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(
    name = "cabin_allocation",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["execution_id", "period_id", "apartment_id"])
    ]
)
data class CabinAllocation(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drawing_id", nullable = false)
    val drawing: CabinDrawing,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    val execution: CabinDrawingExecution,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    val period: CabinPeriod,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = false)
    val apartment: Apartment,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    val allocationType: AllocationType = AllocationType.DRAWN,

    @Column(nullable = true, length = 500)
    val comment: String? = null,

    @Column(nullable = false)
    val allocatedAt: LocalDateTime = LocalDateTime.now()
)

enum class AllocationType {
    DRAWN,      // Tildelt gjennom trekningen
    MANUAL      // Manuelt tildelt av admin
}
