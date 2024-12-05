package no.jpro.mypageapi.entity

import jakarta.persistence.*
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