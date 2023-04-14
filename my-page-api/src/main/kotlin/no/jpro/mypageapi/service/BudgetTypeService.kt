package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.repository.BudgetTypeRepository
import org.springframework.stereotype.Service

@Service
class BudgetTypeService(
    private val budgetTypeRepository: BudgetTypeRepository
) {

    fun getBudgetTypes(): List<BudgetType> {
        return budgetTypeRepository.findAll()
    }

}