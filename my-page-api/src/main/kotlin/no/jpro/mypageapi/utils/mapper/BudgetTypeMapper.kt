package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetTypeDTO
import no.jpro.mypageapi.entity.BudgetType
import org.springframework.stereotype.Service

@Service
class BudgetTypeMapper {
    fun toBudgetType(budgetTypeDTO: BudgetTypeDTO): BudgetType {
        return BudgetType(
            name = budgetTypeDTO.name,
            rollOver = budgetTypeDTO.rollOver,
            deposit = budgetTypeDTO.deposit,
            intervalOfDepositInMonths = budgetTypeDTO.intervalOfDepositInMonths,
            startAmount = budgetTypeDTO.startAmount,
            budgets = listOf()
        )
    }

    fun toBudgetTypeDTO(budgetType: BudgetType): BudgetTypeDTO {
        return BudgetTypeDTO(
            name = budgetType.name,
            rollOver = budgetType.rollOver,
            deposit = budgetType.deposit,
            intervalOfDepositInMonths = budgetType.intervalOfDepositInMonths,
            startAmount = budgetType.startAmount,
        )

    }
}
