package no.jpro.mypageapi.entity

import java.time.LocalDate
import javax.persistence.*

@Entity
data class Budget(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val name: String,
    val startDate: LocalDate,
    val startAmount: Double,
    @OneToMany(mappedBy = "budget")
    var posts: List<Post>,
    @ManyToOne
    var user: User? = null,
    @ManyToOne
    var budgetType: BudgetType

)
