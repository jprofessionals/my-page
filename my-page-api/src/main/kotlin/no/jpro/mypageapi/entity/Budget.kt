package no.jpro.mypageapi.entity

import jakarta.persistence.*
import java.time.LocalDate
import java.time.Period

@Entity
@Table(uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "budget_type_id"])])
data class Budget(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val startDate: LocalDate,
    val startAmount: Double,
    @OneToMany(mappedBy = "budget")
    val posts: List<Post>,
    @ManyToOne
    val user: User? = null,
    @ManyToOne
    val budgetType: BudgetType,
    @OneToMany(mappedBy = "budget")
    val hours: List<Hours>
){
    private fun sumDeposits(toDate: LocalDate): Double {
        if (budgetType.intervalOfDepositInMonths == 0L || budgetType.deposit == 0.0) return 0.0

        return if(budgetType.rollOver){
            val countMonths = Period.between(startDate, toDate).toTotalMonths()
            (countMonths / budgetType.intervalOfDepositInMonths) * budgetType.deposit
        } else {
            val countMonths = Period.between(toDate.withDayOfYear(1), toDate).toTotalMonths()
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

    fun balance(toDate: LocalDate): Double = startAmount + sumDeposits(toDate) - sumPosts(toDate)

    fun hoursInYear(year: Int): Double {
        return hours.filter { it.dateOfUsage.year == year }.sumOf { it.hours }
    }

    override fun toString(): String {
        //explicit .toString() to avoid circular reference in the default implementation
        return "Budget(id=$id, startDate=$startDate, startAmount=$startAmount, user=${user?.id}, budgetType=${budgetType.name}, hours=$hours)"
    }


}
