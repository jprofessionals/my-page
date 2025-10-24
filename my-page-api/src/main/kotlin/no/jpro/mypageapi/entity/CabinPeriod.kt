package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "cabin_period")
data class CabinPeriod(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drawing_id", nullable = false)
    val drawing: CabinDrawing,

    @Column(nullable = false)
    var startDate: LocalDate,

    @Column(nullable = false)
    var endDate: LocalDate,

    @Column(nullable = false)
    var description: String, // "10.02 - 17.02" or "10.02 - 17.02 - Vinterferie"

    @Column(nullable = true)
    var comment: String? = null, // "Vinterferie", "Påske", "JPro julebord", etc.

    @Column(nullable = false)
    var sortOrder: Int = 0 // For sortering i UI
)
