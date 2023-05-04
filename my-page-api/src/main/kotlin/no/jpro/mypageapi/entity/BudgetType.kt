package no.jpro.mypageapi.entity

import jakarta.persistence.*

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
    val budgets: List<Budget>,
    var allowTimeBalance: Boolean = false,
    val default: Boolean = false
)

