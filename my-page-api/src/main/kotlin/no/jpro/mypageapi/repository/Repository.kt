package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, String> {
    fun existsUserBySub(userSub: String): Boolean
    fun findUserBySub(sub: String): User?
    fun findUserByEmailAndSubIsNull(email: String): User?
}

@Repository
interface BudgetRepository : JpaRepository<Budget, Long> {
    fun findBudgetsByUserSub(userSub: String): List<Budget>
    fun findBudgetsByUserEmployeeNumber(userEmployeeNumber: Int): List<Budget>
    fun findBudgetById(budgetId: Long): Budget
}

@Repository
interface PostRepository : JpaRepository<Post, Long> {
    fun findPostById(postId: Long): Post?
}