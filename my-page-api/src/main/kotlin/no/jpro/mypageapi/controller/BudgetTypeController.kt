package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.CreateBudgetTypeDTO
import no.jpro.mypageapi.repository.BudgetTypeRepository
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("budgetCharacteristic")
class BudgetTypeController(
    private val budgetTypeMapper: BudgetTypeMapper,
    private val budgetTypeRepository: BudgetTypeRepository
) {
    @PostMapping("")
    fun createBudgetType(@RequestBody createBudgetTypeDTO: CreateBudgetTypeDTO): CreateBudgetTypeDTO {
        budgetTypeRepository.save(budgetTypeMapper.toBudgetType(createBudgetTypeDTO))
        return createBudgetTypeDTO
    }
}
