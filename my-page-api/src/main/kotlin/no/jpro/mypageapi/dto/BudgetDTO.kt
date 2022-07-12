package no.jpro.mypageapi.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.LocalDate
import java.time.Period

data class BudgetDTO(
    val name: String,
    val id: Long?,
    var posts: List<PostDTO>,
    var budgetType: BudgetTypeDTO,
    val startDate: LocalDate,
    val startAmount: Double
) {
    @JsonProperty
    fun sumDeposits(): Double {
        val toDate = LocalDate.now()
        val adjustedFromDate = if (budgetType.rollOver) startDate else toDate.withDayOfYear(1)
        val countMonths = Period.between(adjustedFromDate, toDate).months
        if (budgetType.intervalOfDepositInMonths == 0L) return 0.0
        return (countMonths / budgetType.intervalOfDepositInMonths) * budgetType.deposit
    }

    @JsonProperty
    fun sumPosts(): Double {
        val toDate = LocalDate.now()
        val adjustedFromDate = if (budgetType.rollOver) startDate else toDate.withDayOfYear(1)
        val filteredPosts =
            posts.filter { post -> (!post.date.isBefore(adjustedFromDate) && !post.date.isAfter(toDate)) }
        return filteredPosts.sumOf { post -> post.amount }
    }

    @JsonProperty
    fun sumPostsLastTwelveMonths(): Double {
        val toDate = LocalDate.now()
        val dateOneYearAgo = toDate.minusYears(1)
        val postsLastTwelveMonths = posts.filter { post ->
            !post.date.isBefore(dateOneYearAgo) && !post.date.isAfter(toDate)
        }
        return postsLastTwelveMonths.sumOf { post -> post.amount }
    }

    @JsonProperty
    fun balance() = startAmount + sumDeposits() - sumPosts()
}
