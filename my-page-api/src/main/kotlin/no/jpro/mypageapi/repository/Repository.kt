package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.entity.User
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