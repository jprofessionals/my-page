package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun existsUserBySub(userSub: String): Boolean
    fun findUserBySub(sub: String): User?
    fun findUserByEmailAndSubIsNull(email: String): User?
    fun findUserByEmail(email: String): User?
    fun findUserByEmailIgnoreCase(email: String): User?
    fun findUserByName(name: String): User?
    fun findByEnabled(enabled: Boolean): List<User>
    fun countByEmployeeNumberIsNotNullAndEnabled(enabled: Boolean): Long
}