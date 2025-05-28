package no.jpro.mypageapi.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany

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
    @Column(name="\"default\"")
    val default: Boolean = false
)

