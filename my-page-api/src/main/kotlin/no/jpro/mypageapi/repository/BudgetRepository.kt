package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.BudgetType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BudgetRepository : JpaRepository<Budget, Long> {
    fun findBudgetsByUserSub(userSub: String): List<Budget>
    fun findBudgetsByUserEmployeeNumber(userEmployeeNumber: Int): List<Budget>
    fun findBudgetById(budgetId: Long): Budget
    fun findBudgetsByUserEmailAndBudgetTypeIn(userEmail: String, budgetTypes: List<BudgetType>): List<Budget>
    fun findBudgetsByUserEnabled(enabled: Boolean): List<Budget>
}