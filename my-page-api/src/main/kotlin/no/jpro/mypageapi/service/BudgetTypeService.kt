package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.repository.BudgetTypeRepository

class BudgetTypeService(
    private val budgetTypeRepository: BudgetTypeRepository
) {

    fun getBudgetTypes(): List<BudgetType> {
        return budgetTypeRepository.findAll()
    }

}