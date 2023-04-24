package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.repository.BudgetTypeRepository
import org.springframework.stereotype.Service

@Service
class BudgetTypeService(
    private val budgetTypeRepository: BudgetTypeRepository
) {

    fun getDefaultBudgetTypes(): List<BudgetType> {
        return budgetTypeRepository.findBudgetTypesByDefault(true)
    }

}