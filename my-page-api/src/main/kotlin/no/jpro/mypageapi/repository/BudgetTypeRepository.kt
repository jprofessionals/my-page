package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.BudgetType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BudgetTypeRepository : JpaRepository<BudgetType, Long> {
    fun findBudgetTypesByDefault(default: Boolean): List<BudgetType>
}