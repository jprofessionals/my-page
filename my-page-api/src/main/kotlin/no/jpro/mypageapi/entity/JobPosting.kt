package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDate

@Entity
class JobPosting(
    val title: String,

    @Lob
    @Column(length = 16777216)
    val description: String?,
    val customer: String,
    val location: String?,
    val dueDateForApplication: LocalDate?,
    val requiredYearsOfExperience: Int?,
    val resourcesNeeded: Int?,
    @ManyToMany(
        cascade = [CascadeType.PERSIST, CascadeType.MERGE],
    )
    @JoinTable(
        name = "job_posting_tags",
        joinColumns = [JoinColumn(name = "job_posting_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id", referencedColumnName = "id")]
    )
    val tags: Set<JobPostingTag> = HashSet(),
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null
)