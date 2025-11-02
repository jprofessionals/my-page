package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.entity.Budget
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.Budget as BudgetModel
import no.jpro.mypageapi.model.BudgetDetail
import no.jpro.mypageapi.model.BudgetDetailBudgetType
import java.math.BigDecimal

@Service
class BudgetMapper(
    private val budgetTypeMapper: BudgetTypeMapper,
    private val hoursMapper: HoursMapper,
    private val postMapper: BudgetPostMapper,
    private val userMapper: UserMapper,
    private val postModelMapper: PostMapper
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

    fun toBudgetModel(budget: Budget): BudgetModel {
        val budgetDTO = toBudgetDTO(budget)
        return BudgetModel(
            id = budget.id?.toString(),
            name = budget.budgetType.name,
            budgetYear = budget.startDate.year,
            amount = BigDecimal.valueOf(budget.startAmount),
            remaining = BigDecimal.valueOf(budgetDTO.balance()),
            user = budget.user?.let { userMapper.toUserModel(userMapper.toUserDTO(it)) }
        )
    }

    fun toBudgetDetailModel(budget: Budget): BudgetDetail {
        val budgetDTO = toBudgetDTO(budget)
        return BudgetDetail(
            id = budget.id ?: 0L,
            posts = budgetDTO.posts.map { postModelMapper.toPostModel(it) },
            budgetType = BudgetDetailBudgetType(
                id = budget.budgetType.id ?: 0L,
                name = budget.budgetType.name,
                startAmount = BigDecimal.valueOf(budget.budgetType.startAmount)
            ),
            startDate = budget.startDate,
            startAmount = BigDecimal.valueOf(budget.startAmount),
            hours = emptyList() // Hours are complex and not needed for the API yet
        )
    }

}