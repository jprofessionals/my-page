package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.CreateBudgetCharacteristicDTO
import no.jpro.mypageapi.repository.BudgetCharacteristicRepository
import no.jpro.mypageapi.utils.mapper.BudgetCharacteristicMapper
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("budgetCharacteristic")
class BudgetCharacteristicsController(private val budgetCharacteristicMapper: BudgetCharacteristicMapper,
private val budgetCharacteristicRepository: BudgetCharacteristicRepository) {
    @PostMapping("")
    fun createBudgetCharacteristic (@RequestBody createBudgetCharacteristicDTO: CreateBudgetCharacteristicDTO) :CreateBudgetCharacteristicDTO {
        budgetCharacteristicRepository.save(budgetCharacteristicMapper.fromCreateBudgetCharacteristicDTOToBudgetCharacteristic(createBudgetCharacteristicDTO))
        return createBudgetCharacteristicDTO
    }
}