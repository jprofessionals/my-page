package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDate

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
    @OneToMany(mappedBy = "budget")
    val hours: List<Hours>
)
