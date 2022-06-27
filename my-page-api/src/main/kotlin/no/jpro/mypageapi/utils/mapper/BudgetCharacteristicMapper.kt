package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.CreateBudgetCharacteristicDTO
import no.jpro.mypageapi.entity.BudgetCharacteristics
import org.springframework.stereotype.Service

@Service
class BudgetCharacteristicMapper {
    fun fromCreateBudgetCharacteristicDTOToBudgetCharacteristic(budgetCharacteristicDTO: CreateBudgetCharacteristicDTO): BudgetCharacteristics {
        return BudgetCharacteristics(
            name = budgetCharacteristicDTO.name,
            rollOver = budgetCharacteristicDTO.rollOver,
            deposit = budgetCharacteristicDTO.deposit,
            intervalOfDepositInMonths = budgetCharacteristicDTO.intervalOfDepositInMonths,
            startAmount = budgetCharacteristicDTO.startAmount,
            budgets = listOf()
        )
    }
}