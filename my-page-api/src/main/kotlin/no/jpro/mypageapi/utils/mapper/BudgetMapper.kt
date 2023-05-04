package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.entity.Budget
import org.springframework.stereotype.Service

@Service
class BudgetMapper(
    private val budgetTypeMapper: BudgetTypeMapper,
    private val hoursMapper: HoursMapper,
    private val postMapper: BudgetPostMapper
) {

    fun toBudgetDTO(budget: Budget): BudgetDTO {
        return BudgetDTO(
            id = budget.id,
            posts = budget.posts.map { postMapper.toPostDTO(it) },
            budgetType = budgetTypeMapper.toBudgetTypeDTO(budget.budgetType),
            startDate = budget.startDate,
            startAmount = budget.startAmount,
            hours = budget.hours.map { hoursMapper.toHoursDTO(it) }
        )
    }

}