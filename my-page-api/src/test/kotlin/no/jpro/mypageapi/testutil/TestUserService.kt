package no.jpro.mypageapi.testutil

import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.stereotype.Component

@Component
class TestUserService(private val userRepository: UserRepository,) {

    fun createUser(email: String, employeeNumber: Int, isAdmin: Boolean = false): User {
        return userRepository.save(
            User(
                email = email,
                employeeNumber = employeeNumber,
                sub = employeeNumber.toString(),
                budgets = listOf(),
                familyName = null,
                givenName = null,
                name = null,
                admin = true
            )
        )
    }
}