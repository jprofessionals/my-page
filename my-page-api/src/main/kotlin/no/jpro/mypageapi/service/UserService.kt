package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.*
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
        userRepository.save(updatedUser)
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

    fun getUserBySub(userSub: String) = userRepository.findUserBySub(userSub)

    fun getAllUsers() = userRepository.findAll().map { userMapper.toUserDTO(it) }
}
