package no.jpro.mypageapi.repository

import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EmployeeRepository : JpaRepository<Employee, Long>

@Repository
interface UserRepository : JpaRepository<User, String> {
    fun existsUserById(userId: String): Boolean
}


@Repository
interface BudgetRepository : JpaRepository<Budget, Long> {
    fun findBudgetsByUserId(userId: String): List<Budget>
    fun findBudgetByUserIdAndId(userId: String, budgetId: Long): Budget?
    fun existsBudgetByUserIdAndId(userId: String, budgetId: Long): Boolean


}

@Repository
interface PostRepository : JpaRepository<Post, Long> {
    fun findPostsByBudgetId(budgetId: Long): List<Post>
    fun findPostByBudgetIdAndId(budgetId: Long, postId: Long): Post?
}

@Repository
interface BudgetTypeRepository : JpaRepository<BudgetType, Long> {
    fun existsBudgetTypeById(budgetTypeId: Long): Boolean
}


