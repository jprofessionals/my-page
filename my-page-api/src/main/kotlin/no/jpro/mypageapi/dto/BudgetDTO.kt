package no.jpro.mypageapi.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.LocalDate
import java.time.Period


data class BudgetDTO(
    val name: String,
    val id: Long?,
    var posts: List<PostDTO>,
    var budgetType: BudgetTypeDTO,

    val startDate: LocalDate
) {
    @JsonProperty
    fun sumDeposits(): Double {
        val toDate = LocalDate.now()
        val adjustedFromDate = if (budgetType.rollOver) startDate else toDate.withDayOfYear(1)
        val countMonths = Period.between(adjustedFromDate, toDate).months
        return (countMonths / budgetType.intervalOfDepositInMonths) * budgetType.deposit
    }

    @JsonProperty
    fun sumPosts(): Double {
        val toDate = LocalDate.now()
        val adjustedFromDate = if (budgetType.rollOver) startDate else toDate.withDayOfYear(1)
        val adjustedPosts = posts.filter { post -> (post.date.isAfter(adjustedFromDate) || post.date.isEqual(adjustedFromDate)) &&
                (post.date.isBefore(toDate) || post.date.isEqual(toDate) ) }
        return adjustedPosts.sumOf { post -> post.amount }
    }

    @JsonProperty
    fun sumPostsLastTwelveMonths(): Double {
        val toDate = LocalDate.now()
        val dateOneYearAgo = toDate.minusYears(1)
        val postsLastTwelveMonths = posts.filter { post -> (post.date.isAfter(dateOneYearAgo) || post.date.isEqual(dateOneYearAgo)) &&
                (post.date.isBefore(toDate) || post.date.isEqual(toDate) ) }
        return postsLastTwelveMonths.sumOf { post -> post.amount }
    }

    @JsonProperty
    fun balance() = budgetType.startAmount + sumDeposits() - sumPosts()
}
