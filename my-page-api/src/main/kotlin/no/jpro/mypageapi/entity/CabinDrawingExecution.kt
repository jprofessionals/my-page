package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "cabin_drawing_execution")
data class CabinDrawingExecution(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drawing_id", nullable = false)
    val drawing: CabinDrawing,

    @Column(nullable = false)
    val executedAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    val executedBy: Long, // userId of admin who executed the draw

    @Column
    val randomSeed: Long? = null, // For reproducibility

    @Column(columnDefinition = "TEXT")
    val auditLog: String? = null, // JSON array of audit log lines

    @OneToMany(mappedBy = "execution", cascade = [CascadeType.ALL])
    val allocations: List<CabinAllocation> = emptyList()
)