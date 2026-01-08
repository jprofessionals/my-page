package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "ktu_customer_organization")
data class KtuCustomerOrganization(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val name: String,

    @Column(name = "organization_number")
    val organizationNumber: String? = null,

    @Column(nullable = false)
    val active: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "organization", fetch = FetchType.LAZY)
    val contacts: List<KtuCustomerContact> = emptyList()
)
