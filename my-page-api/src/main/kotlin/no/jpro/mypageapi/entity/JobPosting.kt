package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.OffsetDateTime

@Entity
@Table(name = "job_posting")
class JobPosting(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "LONGTEXT")
    var description: String? = null,

    @Column(nullable = false)
    var deadline: OffsetDateTime,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    var customer: Customer
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || javaClass != other.javaClass) return false
        other as JobPosting
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}