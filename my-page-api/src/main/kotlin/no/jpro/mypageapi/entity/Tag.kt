package no.jpro.mypageapi.entity

import jakarta.persistence.*

@Entity
@Table(name = "tags")
class Tag(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(nullable = false)
    var name: String,
) {

    @ManyToMany(mappedBy = "tags")
    var jobPostings: Set<JobPosting> = HashSet()

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || javaClass != other.javaClass) return false
        other as Tag
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}