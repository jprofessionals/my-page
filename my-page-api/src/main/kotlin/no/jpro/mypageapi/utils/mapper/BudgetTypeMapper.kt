package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetTypeDTO
import no.jpro.mypageapi.entity.BudgetType
import org.springframework.stereotype.Service

@Service
class BudgetTypeMapper {

    fun toBudgetTypeDTO(budgetType: BudgetType): BudgetTypeDTO {
        return BudgetTypeDTO(
            id = budgetType.id!!,
            name = budgetType.name,
            rollOver = budgetType.rollOver,
            deposit = budgetType.deposit,
            intervalOfDepositInMonths = budgetType.intervalOfDepositInMonths,
            startAmount = budgetType.startAmount,
            allowTimeBalance = budgetType.allowTimeBalance
        )
    }
}
