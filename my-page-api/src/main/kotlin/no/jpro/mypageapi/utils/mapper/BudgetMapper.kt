package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.BudgetSummary as BudgetSummaryDTO
import no.jpro.mypageapi.dto.BudgetYearSummary as BudgetYearSummaryDTO
import no.jpro.mypageapi.entity.Budget
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.Budget as BudgetModel
import no.jpro.mypageapi.model.BudgetDetail
import no.jpro.mypageapi.model.BudgetDetailBudgetType
import no.jpro.mypageapi.model.BudgetSummary as BudgetSummaryModel
import no.jpro.mypageapi.model.BudgetYearSummary as BudgetYearSummaryModel
import java.math.BigDecimal

@Service
class BudgetMapper(
    private val budgetTypeMapper: BudgetTypeMapper,
    private val hoursMapper: HoursMapper,
    private val postMapper: BudgetPostMapper,
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
            id = budget.id,
            posts = budgetDTO.posts.map { postModelMapper.toPostModel(it) },
            budgetType = budgetTypeMapper.toBudgetTypeModel(budget.budgetType),
            startDate = budget.startDate,
            startAmount = BigDecimal.valueOf(budget.startAmount),
            hours = budgetDTO.hours.map { hoursMapper.toHoursModel(it) },
            balance = BigDecimal.valueOf(budgetDTO.balance()),
            sumPosts = BigDecimal.valueOf(budgetDTO.sumPosts()),
            sumPostsCurrentYear = BigDecimal.valueOf(budgetDTO.sumPostsCurrentYear()),
            sumPostsLastTwelveMonths = BigDecimal.valueOf(budgetDTO.sumPostsLastTwelveMonths()),
            sumHours = BigDecimal.valueOf(budgetDTO.sumHours()),
            sumHoursCurrentYear = BigDecimal.valueOf(budgetDTO.sumHoursCurrentYear()),
            sumHoursLastTwelveMonths = BigDecimal.valueOf(budgetDTO.sumHoursLastTwelveMonths())
        )
    }

    fun toBudgetModel(budgetDTO: BudgetDTO): BudgetModel {
        return BudgetModel(
            id = budgetDTO.id,
            posts = budgetDTO.posts.map { postModelMapper.toPostModel(it) },
            budgetType = budgetTypeMapper.toBudgetTypeModel(budgetDTO.budgetType),
            startDate = budgetDTO.startDate,
            startAmount = BigDecimal.valueOf(budgetDTO.startAmount),
            hours = budgetDTO.hours.map { hoursMapper.toHoursModel(it) },
            balance = BigDecimal.valueOf(budgetDTO.balance()),
            sumPosts = BigDecimal.valueOf(budgetDTO.sumPosts()),
            sumPostsCurrentYear = BigDecimal.valueOf(budgetDTO.sumPostsCurrentYear()),
            sumPostsLastTwelveMonths = BigDecimal.valueOf(budgetDTO.sumPostsLastTwelveMonths()),
            sumHours = BigDecimal.valueOf(budgetDTO.sumHours()),
            sumHoursCurrentYear = BigDecimal.valueOf(budgetDTO.sumHoursCurrentYear()),
            sumHoursLastTwelveMonths = BigDecimal.valueOf(budgetDTO.sumHoursLastTwelveMonths())
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

    fun toBudgetSummaryModel(budgetSummaryDTO: BudgetSummaryDTO): BudgetSummaryModel {
        return BudgetSummaryModel(
            year = budgetSummaryDTO.year,
            yearSummary = budgetSummaryDTO.yearSummary.map { toBudgetYearSummaryModel(it) }
        )
    }

    private fun toBudgetYearSummaryModel(budgetYearSummaryDTO: BudgetYearSummaryDTO): BudgetYearSummaryModel {
        return BudgetYearSummaryModel(
            sum = BigDecimal.valueOf(budgetYearSummaryDTO.sum),
            hours = BigDecimal.valueOf(budgetYearSummaryDTO.hours),
            balance = BigDecimal.valueOf(budgetYearSummaryDTO.balance),
            budgetType = budgetYearSummaryDTO.budgetType?.let { budgetTypeMapper.toBudgetTypeModel(it) }
        )
    }

}