package no.jpro.mypageapi.service

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.BudgetTypeRepository
import no.jpro.mypageapi.repository.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@ExtendWith(MockitoExtension::class)
@Import(MockApplicationConfig::class)
@Transactional
class UserServiceTest @Autowired constructor(
    private val userService: UserService,
    private val userRepository: UserRepository,
    private val budgetRepository: BudgetRepository,
    private val budgetTypeRepository: BudgetTypeRepository
) {

    @MockitoBean
    lateinit var jwtDecoder: JwtDecoder

    @MockitoBean
    lateinit var credentialsProvider: CredentialsProvider

    @MockitoBean
    lateinit var gcpProjectIdProvider: GcpProjectIdProvider

    @BeforeEach
    fun setup() {
        budgetRepository.deleteAll()
        userRepository.deleteAll()
        budgetTypeRepository.deleteAll()
    }

    @Test
    fun `createUserWithBudgets should throw when email exists with different employee number`() {
        val existingUser = User(
            email = "test@example.com",
            employeeNumber = 123,
            budgets = emptyList(),
            name = "Test User",
            givenName = "Test",
            familyName = "User"
        )
        userRepository.save(existingUser)

        val exception = assertThrows<IllegalStateException> {
            userService.createUserWithBudgets("test@example.com", 456, LocalDate.now())
        }
        assertEquals("User with email test@example.com already exists with a different employee number", exception.message)
    }

    @Test
    fun `createUserWithBudgets should throw when employee number exists with different email`() {
        val existingUser = User(
            email = "old@example.com",
            employeeNumber = 123,
            budgets = emptyList(),
            name = "Test User",
            givenName = "Test",
            familyName = "User"
        )
        userRepository.save(existingUser)

        val exception = assertThrows<IllegalStateException> {
            userService.createUserWithBudgets("new@example.com", 123, LocalDate.now())
        }
        assertEquals("User with employee number 123 already exists with a different email", exception.message)
    }

    @Test
    fun `createUserWithBudgets should throw when user exists with budgets`() {
        val budgetType = budgetTypeRepository.save(BudgetType(
            name = "Test Budget",
            rollOver = false,
            deposit = 0.0,
            intervalOfDepositInMonths = 1,
            startAmount = 1000.0,
            budgets = emptyList()
        ))

        val existingUser = userRepository.save(User(
            email = "test@example.com",
            employeeNumber = 123,
            budgets = emptyList(),
            name = "Test User",
            givenName = "Test",
            familyName = "User"
        ))
        
        // We need to actually add a budget to the user
        val budget = Budget(
            id = null,
            startDate = LocalDate.now(),
            startAmount = 1000.0,
            user = existingUser,
            budgetType = budgetType,
            posts = emptyList(),
            hours = emptyList()
        )
        budgetRepository.save(budget)

        val exception = assertThrows<IllegalStateException> {
            userService.createUserWithBudgets("test@example.com", 123, LocalDate.now())
        }
        assertEquals("User already exists with an existing budget", exception.message)
    }

    @Test
    fun `createUserWithBudgets should succeed when user exists but has no budgets`() {
         userRepository.save(User(
            email = "test@example.com",
            employeeNumber = 123,
            budgets = emptyList(),
            name = "Test User",
            givenName = "Test",
            familyName = "User"
        ))

        // This should not throw because budgets is empty
        userService.createUserWithBudgets("test@example.com", 123, LocalDate.now())
    }

    @Test
    fun `createUserWithBudgets should succeed when user exists with employeeNumber = null`() {
        userRepository.save(User(
            email = "test@example.com",
            employeeNumber = null,
            budgets = emptyList(),
            name = "Test User",
            givenName = "Test",
            familyName = "User"
        ))

        // This should succeed and update the employee number
        val result = userService.createUserWithBudgets("test@example.com", 123, LocalDate.now())
        
        assertEquals(123, result.employeeNumber)
        val updatedUser = userRepository.findUserByEmail("test@example.com")
        assertEquals(123, updatedUser?.employeeNumber)
    }
}
