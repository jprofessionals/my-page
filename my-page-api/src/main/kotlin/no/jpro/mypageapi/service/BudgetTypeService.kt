package no.jpro.mypageapi.service

import no.jpro.mypageapi.repository.BudgetTypeRepository
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import org.springframework.stereotype.Service

@Service
class BudgetTypeService(
    private val budgetTypeMapper: BudgetTypeMapper,
    private val budgetTypeRepository: BudgetTypeRepository
) {

    //fun createBudgetCharacteristic(createBudgetTypeDTO: CreateBudgetTypeDTO): CreateBudgetTypeDTO {
    //var budgetCharDTO=
    //    budgetTypeMapper.fromCreateBudgetCharacteristicDTOToBudgetCharacteristic(
    //        createBudgetTypeDTO
    //    )
    //budgetCharacteristicRepository.save(budgetCharDTO)
    //return budgetCharDTO
    //}
}
