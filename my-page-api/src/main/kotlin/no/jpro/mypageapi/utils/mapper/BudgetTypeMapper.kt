package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetTypeDTO
import no.jpro.mypageapi.entity.BudgetType
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.BudgetType as BudgetTypeModel
import java.math.BigDecimal

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

    fun toBudgetTypeModel(budgetType: BudgetType): BudgetTypeModel {
        return BudgetTypeModel(
            id = budgetType.id!!,
            name = budgetType.name,
            rollOver = budgetType.rollOver,
            deposit = BigDecimal.valueOf(budgetType.deposit),
            intervalOfDepositInMonths = budgetType.intervalOfDepositInMonths,
            startAmount = BigDecimal.valueOf(budgetType.startAmount),
            allowTimeBalance = budgetType.allowTimeBalance
        )
    }

    fun toBudgetTypeModel(budgetTypeDTO: BudgetTypeDTO): BudgetTypeModel {
        return BudgetTypeModel(
            id = budgetTypeDTO.id,
            name = budgetTypeDTO.name,
            rollOver = budgetTypeDTO.rollOver,
            deposit = BigDecimal.valueOf(budgetTypeDTO.deposit),
            intervalOfDepositInMonths = budgetTypeDTO.intervalOfDepositInMonths,
            startAmount = BigDecimal.valueOf(budgetTypeDTO.startAmount),
            allowTimeBalance = budgetTypeDTO.allowTimeBalance
        )
    }
}
