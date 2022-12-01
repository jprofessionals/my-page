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
    fun findBudgetByUserSubAndId(userSub: String, budgetId: Long): Budget?
    fun existsBudgetByUserSubAndId(userSub: String, budgetId: Long): Boolean
}

@Repository
interface PostRepository : JpaRepository<Post, Long> {
    fun findPostByIdAndBudgetUserSub(postId: Long, userSub: String): Post?
}