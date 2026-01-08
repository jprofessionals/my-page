package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "ktu_customer_contact")
data class KtuCustomerContact(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val name: String,

    val email: String? = null,

    val phone: String? = null,

    val title: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    val organization: KtuCustomerOrganization,

    @Column(nullable = false)
    val active: Boolean = true,

    @Column(name = "opted_out", nullable = false)
    val optedOut: Boolean = false,

    @Column(name = "opted_out_at")
    val optedOutAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "contact", fetch = FetchType.LAZY)
    val assignments: List<KtuAssignment> = emptyList()
)
