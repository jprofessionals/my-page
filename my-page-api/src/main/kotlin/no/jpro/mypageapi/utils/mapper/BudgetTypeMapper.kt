package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.CreateBudgetTypeDTO
import no.jpro.mypageapi.entity.BudgetType
import org.springframework.stereotype.Service

@Service
class BudgetTypeMapper {
    fun toBudgetType(createBudgetTypeDTO: CreateBudgetTypeDTO): BudgetType {
        return BudgetType(
            name = createBudgetTypeDTO.name,
            rollOver = createBudgetTypeDTO.rollOver,
            deposit = createBudgetTypeDTO.deposit,
            intervalOfDepositInMonths = createBudgetTypeDTO.intervalOfDepositInMonths,
            startAmount = createBudgetTypeDTO.startAmount,
            budgets = listOf()
        )
    }
}
