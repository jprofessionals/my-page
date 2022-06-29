package no.jpro.mypageapi.entity

import javax.persistence.*

@Entity
data class BudgetType(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val name: String,
    val rollOver: Boolean,
    val deposit: Double,
    val intervalOfDepositInMonths: Long,
    val startAmount: Double,
    @OneToMany(mappedBy = "budgetType")
    var budgets: List<Budget>
)

