package no.jpro.mypageapi.entity

import jakarta.persistence.*
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.User
import java.util.UUID

@Entity
@Table(name = "cabin_wish")
data class CabinWish(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drawing_id", nullable = false)
    val drawing: CabinDrawing,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    val period: CabinPeriod,
    
    @Column(nullable = false)
    val priority: Int, // 1 = høyest
    
    @ManyToMany
    @JoinTable(
        name = "cabin_wish_apartments",
        joinColumns = [JoinColumn(name = "wish_id")],
        inverseJoinColumns = [JoinColumn(name = "apartment_id")]
    )
    val desiredApartments: List<Apartment> = emptyList(), // Kan ønske flere enheter
    
    @Column(length = 1000)
    val comment: String? = null
)
