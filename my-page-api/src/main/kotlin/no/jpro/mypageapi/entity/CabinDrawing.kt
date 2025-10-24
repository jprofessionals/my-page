package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "cabin_drawing")
data class CabinDrawing(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    
    @Column(nullable = false)
    val season: String, // "VINTER_2025_2026", "SOMMER_2026"
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    var status: DrawingStatus = DrawingStatus.DRAFT,
    
    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    
    @Column
    var lockedAt: LocalDateTime? = null,
    
    @Column
    var drawnAt: LocalDateTime? = null,
    
    @Column
    var publishedAt: LocalDateTime? = null,
    
    @Column
    val randomSeed: Long? = null, // For reproduserbarhet
    
    @OneToMany(mappedBy = "drawing", cascade = [CascadeType.ALL])
    val periods: List<CabinPeriod> = emptyList(),
    
    @OneToMany(mappedBy = "drawing", cascade = [CascadeType.ALL])
    val wishes: List<CabinWish> = emptyList(),
    
    @OneToMany(mappedBy = "drawing", cascade = [CascadeType.ALL])
    val allocations: List<CabinAllocation> = emptyList()
)

enum class DrawingStatus {
    DRAFT,      // Utkast - admin kan redigere, brukere kan ikke se
    OPEN,       // Åpen for ønskeregistrering
    LOCKED,     // Låst, ingen flere endringer
    DRAWN,      // Trekning utført, ikke publisert
    PUBLISHED   // Resultater publisert til brukere
}
