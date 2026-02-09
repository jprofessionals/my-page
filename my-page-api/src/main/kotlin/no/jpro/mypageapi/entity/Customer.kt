package no.jpro.mypageapi.entity

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.annotations.JdbcTypeCode
import java.sql.Types

@Entity
@Table(
    name = "customer",
    uniqueConstraints = [UniqueConstraint(columnNames = ["name"])]
)
class Customer(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = true)
    @JdbcTypeCode(Types.TINYINT)
    var exclusive: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var sector: CustomerSector = CustomerSector.UNKNOWN,

    @OneToMany(mappedBy = "customer", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    var jobPostings: Set<JobPosting> = HashSet()
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Customer) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
