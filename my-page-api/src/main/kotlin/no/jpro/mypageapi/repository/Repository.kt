package no.jpro.mypageapi.repository

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, String> {
    fun existsUserBySub(userSub: String): Boolean
    fun findUserBySub(sub: String): User?
    fun findUserByEmailAndSubIsNull(email: String): User?
    fun findUserByEmail(email: String): User?
}

@Repository
interface BudgetTypeRepository : JpaRepository<BudgetType, Long> {
    fun findBudgetTypesByDefault(default: Boolean): List<BudgetType>
}

@Repository
interface BudgetRepository : JpaRepository<Budget, Long> {
    fun findBudgetsByUserSub(userSub: String): List<Budget>
    fun findBudgetsByUserEmployeeNumber(userEmployeeNumber: Int): List<Budget>
    fun findBudgetById(budgetId: Long): Budget
    fun findBudgetsByUserEmailAndBudgetTypeIn(userEmail: String, budgetTypes: List<BudgetType>): List<Budget>
}

@Repository
interface PostRepository : JpaRepository<Post, Long> {
    fun findPostById(postId: Long): Post?
}

@Repository
interface JobPostingRepository : JpaRepository<JobPosting, Long>


//Todo: lage ferdig booking repository
@Repository
interface BookingRepository : JpaRepository<Booking, Long> {
    fun findBookingById(bookingId: Long): Booking
//    fun findBookingByEmployeeId(employee_id: Long): List<Booking>

}
