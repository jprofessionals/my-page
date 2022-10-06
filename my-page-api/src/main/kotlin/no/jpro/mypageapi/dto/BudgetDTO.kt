package no.jpro.mypageapi.dto

import com.fasterxml.jackson.annotation.JsonProperty
import no.jpro.mypageapi.entity.Hours
import java.time.LocalDate
import java.time.Period

data class BudgetDTO(
    val id: Long?,
    val posts: List<PostDTO>,
    val budgetType: BudgetTypeDTO,
    val startDate: LocalDate,
    val startAmount: Double,
    val hours: List<Hours>
) {
        @JsonProperty
    fun sumPosts(): Double = posts.sumOf { post -> post.amountExMva ?: 0.0 }

    @JsonProperty
    fun sumPostsLastTwelveMonths(): Double {
        val toDate = LocalDate.now()
        val dateOneYearAgo = toDate.minusYears(1)
        val postsLastTwelveMonths = posts.filter { post ->
            !post.date.isBefore(dateOneYearAgo) && !post.date.isAfter(toDate)
        }
        return postsLastTwelveMonths.sumOf { post -> post.amountExMva ?: 0.0 }
    }

    @JsonProperty
    fun sumPostsCurrentYear(): Double {
        val toDate = LocalDate.now()
        val startOfYear = toDate.withDayOfYear(1)
        val postsCurrentYear = posts.filter { post ->
            !post.date.isBefore(startOfYear) && !post.date.isAfter(toDate)
        }
        return postsCurrentYear.sumOf { post -> post.amountExMva ?: 0.0 }
    }


    private fun sumDeposits(toDate: LocalDate): Double {
        if (budgetType.intervalOfDepositInMonths == 0L || budgetType.deposit == 0.0) return 0.0

        return if(budgetType.rollOver){
            val countMonths = Period.between(startDate, toDate).months
            (countMonths / budgetType.intervalOfDepositInMonths) * budgetType.deposit
        } else {
            val countMonths = Period.between(toDate.withDayOfYear(1), toDate).months
            (countMonths / budgetType.intervalOfDepositInMonths) * budgetType.deposit
        }
    }

    private fun sumPosts(toDate: LocalDate): Double {
        return if(budgetType.rollOver){
            posts.sumOf { post -> post.amountExMva ?: 0.0 }
        } else {
            val startOfYear = toDate.withDayOfYear(1)
            return posts.filter { post -> !post.date.isBefore(startOfYear) && !post.date.isAfter(toDate) }.sumOf { post -> post.amountExMva ?: 0.0 }
        }
    }

    @JsonProperty
    fun balance(): Double = startAmount + sumDeposits(LocalDate.now()) - sumPosts(LocalDate.now())

    @JsonProperty
    fun hoursUsed(): Int = hours.sumOf { it.hours }
}
