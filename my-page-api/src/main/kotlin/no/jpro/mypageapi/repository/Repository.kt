package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EmployeeRepository : JpaRepository<Employee, Long>

@Repository
interface UserRepository : JpaRepository<User, String>


@Repository
interface BudgetRepository : JpaRepository<Budget, Long> {
    fun findBudgetsByUserId(userId: String): List<Budget>
    fun findBudgetByUserIdAndId(userId: String, budgetId: Long): Budget?
}

@Repository
interface PostRepository : JpaRepository<Post, Long> {
    fun findPostsByBudgetId(budgetId: Long): List<Post>
    fun findPostByBudgetIdAndId(budgetId: Long, postId: Long): Post?
}

@Repository
interface BudgetTypeRepository : JpaRepository<BudgetType, Long>


