package no.jpro.mypageapi.entity

import java.time.LocalDate
import javax.persistence.*

@Entity
@Table(uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "budget_type_id"])])
data class Budget(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val startDate: LocalDate,
    val startAmount: Double,
    @OneToMany(mappedBy = "budget")
    val posts: List<Post>,
    @ManyToOne
    val user: User? = null,
    @ManyToOne
    val budgetType: BudgetType,
    val hoursUsed: Int
)
