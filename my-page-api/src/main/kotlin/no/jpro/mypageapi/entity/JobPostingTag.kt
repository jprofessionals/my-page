package no.jpro.mypageapi.entity

import jakarta.persistence.*

@Entity
@Table(name = "tags")
class JobPostingTag(

    @Column(nullable = false)
    val name: String,

    @ManyToMany(
        mappedBy = "tags",
    )
    val jobPostings: Set<JobPosting> = HashSet(),

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null
)