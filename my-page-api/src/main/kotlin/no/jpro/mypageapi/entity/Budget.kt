package no.jpro.mypageapi.entity

import javax.persistence.*

@Entity
data class Budget(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val name: String,
    val ageOfBudgetInMonths: Long,
    @OneToMany(mappedBy = "budget")
    var posts: List<Post>,
    @ManyToOne
    var user: User

)