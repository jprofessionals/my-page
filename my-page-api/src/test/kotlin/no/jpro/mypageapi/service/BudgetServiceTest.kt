package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.UpdatePostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import java.time.LocalDate

@ExtendWith(MockitoExtension::class)
class BudgetServiceTest {

    @Mock
    private lateinit var budgetRepository: BudgetRepository

    @Mock
    private lateinit var budgetPostMapper: BudgetPostMapper

    @Mock
    private lateinit var postRepository: PostRepository

    @Mock
    private lateinit var budgetTypeService: BudgetTypeService

    @Mock
    private lateinit var budgetTypeMapper: BudgetTypeMapper

    private lateinit var budgetService: BudgetService

    @BeforeEach
    fun setup() {
        budgetService = BudgetService(
            budgetRepository,
            budgetPostMapper,
            postRepository,
            budgetTypeService,
            budgetTypeMapper
        )
    }

    @Nested
    inner class InitializeBudgetsForNewEmployee {

        @Test
        fun `should create budgets for all default budget types`() {
            // Arrange
            val user = createTestUser("test@example.com")
            val budgetTypes = listOf(
                createBudgetType(1L, "Fagbudsjett"),
                createBudgetType(2L, "Utstyrsbudsjett")
            )
            val startDate = LocalDate.of(2025, 1, 1)

            whenever(budgetTypeService.getDefaultBudgetTypes()).thenReturn(budgetTypes)
            whenever(budgetRepository.findBudgetsByUserEmailAndBudgetTypeIn(eq("test@example.com"), any()))
                .thenReturn(emptyList())
            whenever(budgetRepository.saveAll(any<List<Budget>>())).thenAnswer { it.arguments[0] as List<Budget> }

            // Act
            val result = budgetService.initializeBudgetsForNewEmployee(user, startDate)

            // Assert
            assertEquals(2, result.size)
            verify(budgetRepository).saveAll(argThat<List<Budget>> { budgets ->
                budgets.size == 2 &&
                budgets.all { it.user == user && it.startDate == startDate }
            })
        }

        @Test
        fun `should throw when user already has budgets for default types`() {
            // Arrange
            val user = createTestUser("test@example.com")
            val budgetType = createBudgetType(1L, "Fagbudsjett")
            val existingBudget = Budget(
                id = 1L,
                startDate = LocalDate.of(2024, 1, 1),
                startAmount = 10000.0,
                user = user,
                budgetType = budgetType,
                posts = emptyList(),
                hours = emptyList()
            )

            whenever(budgetTypeService.getDefaultBudgetTypes()).thenReturn(listOf(budgetType))
            whenever(budgetRepository.findBudgetsByUserEmailAndBudgetTypeIn(eq("test@example.com"), any()))
                .thenReturn(listOf(existingBudget))

            // Act & Assert
            val exception = assertThrows(IllegalArgumentException::class.java) {
                budgetService.initializeBudgetsForNewEmployee(user, LocalDate.now())
            }
            assertEquals("User already has budgets for default budget types", exception.message)
        }

        @Test
        fun `should throw when user has no email`() {
            // Arrange
            val user = User(
                id = 1L,
                email = null,
                name = "Test User",
                givenName = "Test",
                familyName = "User",
                budgets = emptyList()
            )

            whenever(budgetTypeService.getDefaultBudgetTypes()).thenReturn(listOf(createBudgetType(1L, "Test")))

            // Act & Assert
            val exception = assertThrows(IllegalArgumentException::class.java) {
                budgetService.initializeBudgetsForNewEmployee(user, LocalDate.now())
            }
            assertEquals("Cannot check budgets for user with no email", exception.message)
        }

        @Test
        fun `should use budget type start amount for new budgets`() {
            // Arrange
            val user = createTestUser("test@example.com")
            val budgetType = createBudgetType(1L, "Fagbudsjett", startAmount = 15000.0)
            val startDate = LocalDate.of(2025, 1, 1)

            whenever(budgetTypeService.getDefaultBudgetTypes()).thenReturn(listOf(budgetType))
            whenever(budgetRepository.findBudgetsByUserEmailAndBudgetTypeIn(any(), any()))
                .thenReturn(emptyList())
            whenever(budgetRepository.saveAll(any<List<Budget>>())).thenAnswer { it.arguments[0] as List<Budget> }

            // Act
            val result = budgetService.initializeBudgetsForNewEmployee(user, startDate)

            // Assert
            assertEquals(1, result.size)
            assertEquals(15000.0, result[0].startAmount)
        }
    }

    @Nested
    inner class GetBudgets {

        @Test
        fun `should return budgets for user by sub`() {
            // Arrange
            val userSub = "user-sub-123"
            val budget = mock<Budget>()

            whenever(budgetRepository.findBudgetsByUserSub(userSub)).thenReturn(listOf(budget))
            whenever(budgetPostMapper.toBudgetDTO(budget)).thenReturn(mock())

            // Act
            val result = budgetService.getBudgets(userSub)

            // Assert
            assertEquals(1, result.size)
            verify(budgetRepository).findBudgetsByUserSub(userSub)
        }

        @Test
        fun `should return budgets for user by employee number`() {
            // Arrange
            val employeeNumber = 12345
            val budget = mock<Budget>()

            whenever(budgetRepository.findBudgetsByUserEmployeeNumber(employeeNumber)).thenReturn(listOf(budget))
            whenever(budgetPostMapper.toBudgetDTO(budget)).thenReturn(mock())

            // Act
            val result = budgetService.getBudgets(employeeNumber)

            // Assert
            assertEquals(1, result.size)
            verify(budgetRepository).findBudgetsByUserEmployeeNumber(employeeNumber)
        }

        @Test
        fun `should return empty list when user has no budgets`() {
            // Arrange
            whenever(budgetRepository.findBudgetsByUserSub(any())).thenReturn(emptyList())

            // Act
            val result = budgetService.getBudgets("user-sub")

            // Assert
            assertTrue(result.isEmpty())
        }
    }

    @Nested
    inner class PostOperations {

        @Test
        fun `should create post with budget and creator`() {
            // Arrange
            val createPostDTO = CreatePostDTO(
                date = LocalDate.of(2025, 1, 15),
                description = "Kurs",
                amountIncMva = 6250.0,
                amountExMva = 5000.0,
                expense = true
            )
            val budget = mock<Budget>()
            val createdBy = createTestUser("creator@example.com")
            val mappedPost = Post(
                id = null,
                date = createPostDTO.date,
                description = createPostDTO.description,
                amountIncMva = createPostDTO.amountIncMva,
                amountExMva = createPostDTO.amountExMva,
                expense = createPostDTO.expense,
                budget = null,
                createdBy = null
            )

            whenever(budgetPostMapper.toPost(createPostDTO)).thenReturn(mappedPost)
            whenever(postRepository.save(any<Post>())).thenAnswer {
                (it.arguments[0] as Post).copy(id = 1L)
            }
            whenever(budgetPostMapper.toPostDTO(any())).thenReturn(mock())

            // Act
            budgetService.createPost(createPostDTO, budget, createdBy)

            // Assert
            verify(postRepository).save(argThat<Post> { post ->
                post.budget == budget && post.createdBy == createdBy
            })
        }

        @Test
        fun `should delete post by id`() {
            // Arrange
            val postId = 123L

            // Act
            budgetService.deletePost(postId)

            // Assert
            verify(postRepository).deleteById(postId)
        }

        @Test
        fun `should return post by id`() {
            // Arrange
            val postId = 123L
            val post = mock<Post>()
            whenever(postRepository.findPostById(postId)).thenReturn(post)

            // Act
            val result = budgetService.getPost(postId)

            // Assert
            assertEquals(post, result)
        }

        @Test
        fun `should return null when post not found`() {
            // Arrange
            whenever(postRepository.findPostById(any())).thenReturn(null)

            // Act
            val result = budgetService.getPost(999L)

            // Assert
            assertNull(result)
        }

        @Test
        fun `should update only provided fields in editPost`() {
            // Arrange
            val originalPost = Post(
                id = 1L,
                date = LocalDate.of(2025, 1, 1),
                description = "Original description",
                amountIncMva = 1250.0,
                amountExMva = 1000.0,
                expense = true,
                budget = null,
                createdBy = null
            )
            val updateRequest = UpdatePostDTO(
                description = "Updated description",
                date = null,
                amountExMva = null
            )

            whenever(postRepository.save(any<Post>())).thenAnswer { it.arguments[0] }
            whenever(budgetPostMapper.toPostDTO(any())).thenReturn(mock())

            // Act
            budgetService.editPost(updateRequest, originalPost)

            // Assert
            verify(postRepository).save(argThat<Post> { post ->
                post.description == "Updated description" &&
                post.date == LocalDate.of(2025, 1, 1) &&
                post.amountExMva == 1000.0
            })
        }
    }

    @Nested
    inner class GetBudget {

        @Test
        fun `should return budget by id`() {
            // Arrange
            val budgetId = 123L
            val budget = mock<Budget>()
            whenever(budgetRepository.findBudgetById(budgetId)).thenReturn(budget)

            // Act
            val result = budgetService.getBudget(budgetId)

            // Assert
            assertEquals(budget, result)
        }

        @Test
        fun `should return null when budget not found`() {
            // Arrange
            whenever(budgetRepository.findBudgetById(any())).thenReturn(null)

            // Act
            val result = budgetService.getBudget(999L)

            // Assert
            assertNull(result)
        }
    }

    private fun createTestUser(email: String): User {
        return User(
            id = email.hashCode().toLong(),
            email = email,
            name = "Test User",
            givenName = "Test",
            familyName = "User",
            budgets = emptyList()
        )
    }

    private fun createBudgetType(id: Long, name: String, startAmount: Double = 10000.0): BudgetType {
        return BudgetType(
            id = id,
            name = name,
            rollOver = false,
            deposit = 0.0,
            intervalOfDepositInMonths = 12,
            startAmount = startAmount,
            budgets = emptyList()
        )
    }
}
