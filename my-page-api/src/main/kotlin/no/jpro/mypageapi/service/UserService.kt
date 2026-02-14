package no.jpro.mypageapi.service

import no.jpro.mypageapi.controller.InvalidUserSubException
import no.jpro.mypageapi.controller.UserNotFoundException
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
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userMapper: UserMapper,
    private val budgetService: BudgetService
) {

    @Transactional
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

    @Transactional
    fun createUserWithBudgets(email: String, employeeNumber: Int, budgetStartDate: LocalDate): User {
        val userByEmail = userRepository.findUserByEmail(email)
        val userByEmployeeNumber = userRepository.findUserByEmployeeNumber(employeeNumber)

        if (userByEmail?.employeeNumber != null && userByEmail.employeeNumber != employeeNumber) {
            throw IllegalStateException("User with email $email already exists with a different employee number")
        }

        if (userByEmployeeNumber != null && userByEmployeeNumber.email != email) {
            throw IllegalStateException("User with employee number $employeeNumber already exists with a different email")
        }

        val user = userByEmail ?: userByEmployeeNumber

        if (user?.employeeNumber != null) {
            val budgets = budgetService.getBudgets(user.employeeNumber)
            if (budgets.isNotEmpty()) {
                throw IllegalStateException("User already exists with an existing budget")
            }
        }

        return initializeNewEmployee(email, employeeNumber, budgetStartDate)
    }

    @Transactional
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

    @Transactional
    fun updateAdmin(email: String, isAdmin: Boolean): User {
        val user = getValidUserByEmail(email)
        return userRepository.save(user.copy(admin = isAdmin))
    }

    @Transactional
    fun updateActive(email: String, isActive: Boolean): User {
        val user = getValidUserByEmail(email)
        return userRepository.save(user.copy(
            enabled = isActive,
            disabledAt = if (!isActive) LocalDate.now() else null
        ))
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

    fun getUserByEmail(email: String) = userRepository.findUserByEmail(email)

    fun getValidUserByEmail(email: String): User {
        return userRepository.findUserByEmail(email) ?: throw UserNotFoundException("User with email $email not found")
    }

    fun getValidUserBySub(userSub: String?): User {
        if (userSub == null) {
            throw InvalidUserSubException("User sub cannot be null")
        }
        return userRepository.findUserBySub(userSub) ?: throw UserNotFoundException("No user found for sub: $userSub")
    }

    @Transactional(readOnly = true)
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
