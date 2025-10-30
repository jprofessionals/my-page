package no.jpro.mypageapi.service

import no.jpro.mypageapi.controller.InvalidUserSubException
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getEmail
import no.jpro.mypageapi.extensions.getFamilyName
import no.jpro.mypageapi.extensions.getGivenName
import no.jpro.mypageapi.extensions.getIcon
import no.jpro.mypageapi.extensions.getName
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userMapper: UserMapper,
    private val budgetService: BudgetService
) {

    fun initializeNewEmployee(email: String, employeeNumber: Int, budgetStartDate: LocalDate): User {
        val existingUser = getUserByEmail(email)

        val userWithEmployeeNumber = existingUser?.let {
            saveUpdatedEmployeeNumberForUser(it, employeeNumber)
        } ?: saveUser(email, employeeNumber)

        budgetService.initializeBudgetsForNewEmployee(userWithEmployeeNumber, budgetStartDate)

        return userWithEmployeeNumber
    }

    private fun saveUser(email: String, employeeNumber: Int): User {
        return userRepository.save(
            User(
                email = email,
                employeeNumber = employeeNumber,
                budgets = listOf(),
                familyName = null,
                givenName = null,
                name = null
            )
        )
    }

    private fun saveUpdatedEmployeeNumberForUser(user: User, employeeNumber: Int): User {
        val updatedUser = user.copy(employeeNumber = employeeNumber)
        return userRepository.save(updatedUser)
    }

    fun getOrCreateUser(jwt: Jwt): UserDTO {
        val user =
            userRepository.findUserBySub(jwt.getSub())
                ?: findUserByEmailAndConnect(jwt)
                ?: createUser(jwt)
        return userMapper.toUserDTO(user)
    }

    fun createUser(jwt: Jwt): User {
        return userRepository.save(userMapper.toUser(jwt))
    }

    fun updateAdmin(email: String, isAdmin: Boolean): User {
        val user = userRepository.findUserByEmail(email)
        return userRepository.save(user!!.copy(admin = isAdmin))
    }

    fun updateActive(email: String, isActive: Boolean): User {
        val user = userRepository.findUserByEmail(email)
        return userRepository.save(user!!.copy(enabled = isActive))
    }

    fun findUserByEmailAndConnect(jwt: Jwt): User? {
        val user = userRepository.findUserByEmailAndSubIsNull(jwt.getEmail()) ?: return null
        return userRepository.save(
            user.copy(
                sub = jwt.getSub(),
                icon = jwt.getIcon(),
                name = jwt.getName(),
                givenName = jwt.getGivenName(),
                familyName = jwt.getFamilyName()
            )
        )
    }

    fun checkIfUserExists(userSub: String): Boolean {
        return userRepository.existsUserBySub(userSub)
    }

    fun getUserByEmail(email: String) = userRepository.findUserByEmail(email)

    @Deprecated("Use getValidUserBySub (and then rename it")
    // TODO: he service should throw the exception which should be mapped to the http code instead of handling this
    // in the controller for each case
    fun getUserBySub(userSub: String) = userRepository.findUserBySub(userSub)

    fun getValidUserBySub(userSub: String?): User {
        if (userSub == null) {
            throw InvalidUserSubException("User sub cannot be null")
        }
        return userRepository.findUserBySub(userSub) ?: throw InvalidUserSubException("No user found for sub: $userSub")
    }

    fun getAllUsers(isEnabled: Boolean) = userRepository.findByEnabled(isEnabled).map { userMapper.toUserDTO(it) }

    fun getUserByName(name: String) = userRepository.findUserByName(name)

    /**
     * Get user by ID for testing purposes only.
     * Should only be used in development/test environments.
     */
    fun getTestUserById(testUserId: String?): User? {
        if (testUserId == null) return null
        return try {
            userRepository.findById(testUserId.toLong()).orElse(null)
        } catch (e: NumberFormatException) {
            null
        }
    }
}
