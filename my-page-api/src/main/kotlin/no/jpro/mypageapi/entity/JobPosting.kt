package no.jpro.mypageapi.entity

import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import java.sql.Types
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

    @Column
    var deadline: OffsetDateTime? = null,

    @Column(nullable = true)
    @JdbcTypeCode(Types.TINYINT)
    var urgent: Boolean = false,

    @Column(nullable = true)
    @JdbcTypeCode(Types.TINYINT)
    var hidden: Boolean = false,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    var customer: Customer,

    @ManyToMany
    @JoinTable(
        name = "job_posting_tags",
        joinColumns = [JoinColumn(name = "job_posting_id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id")]
    )
    var tags: List<Tag> = mutableListOf(),

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "links", joinColumns = [JoinColumn(name = "job_posting_id")])
    @Column(name = "url", nullable = false)
    var links: List<String> = mutableListOf(),
) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || javaClass != other.javaClass) return false
        other as JobPosting
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
