package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.FlowcaseUserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.UserRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*

@ExtendWith(MockitoExtension::class)
class UserSyncServiceTest {

    @Mock
    private lateinit var flowcaseService: FlowcaseService

    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var userSaveHelper: UserSaveHelper

    private lateinit var userSyncService: UserSyncService

    @BeforeEach
    fun setup() {
        userSyncService = UserSyncService(flowcaseService, userRepository, userSaveHelper)
    }

    @Nested
    inner class SyncFromFlowcase {

        @Test
        fun `should create new users from Flowcase`() {
            // Arrange
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = "Test User",
                    imageUrl = "https://example.com/image.jpg"
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(emptyList())
            whenever(userSaveHelper.saveUser(any())).thenAnswer { it.arguments[0] as User }

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.totalFromFlowcase)
            assertEquals(1, result.created)
            assertEquals(0, result.updated)
            assertEquals(0, result.skipped)
            assertTrue(result.errors.isEmpty())

            verify(userSaveHelper).saveUser(argThat { user ->
                user.email == "test@example.com" &&
                user.name == "Test User" &&
                user.givenName == "Test" &&
                user.familyName == "User"
            })
        }

        @Test
        fun `should update existing user when name changes`() {
            // Arrange
            val existingUser = User(
                id = 1L,
                email = "test@example.com",
                name = "Old Name",
                givenName = "Old",
                familyName = "Name",
                budgets = emptyList()
            )
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = "New Name",
                    imageUrl = null
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(listOf(existingUser))
            whenever(userSaveHelper.saveUser(any())).thenAnswer { it.arguments[0] as User }

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.totalFromFlowcase)
            assertEquals(0, result.created)
            assertEquals(1, result.updated)
            assertEquals(0, result.skipped)

            verify(userSaveHelper).saveUser(argThat { user ->
                user.name == "New Name"
            })
        }

        @Test
        fun `should skip user when name is unchanged`() {
            // Arrange
            val existingUser = User(
                id = 1L,
                email = "test@example.com",
                name = "Same Name",
                givenName = "Same",
                familyName = "Name",
                budgets = emptyList()
            )
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = "Same Name",
                    imageUrl = null
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(listOf(existingUser))

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.totalFromFlowcase)
            assertEquals(0, result.created)
            assertEquals(0, result.updated)
            assertEquals(1, result.skipped)

            verify(userSaveHelper, never()).saveUser(any())
        }

        @Test
        fun `should match users case-insensitively by email`() {
            // Arrange
            val existingUser = User(
                id = 1L,
                email = "Test@Example.COM",
                name = "Old Name",
                givenName = "Old",
                familyName = "Name",
                budgets = emptyList()
            )
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = "New Name",
                    imageUrl = null
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(listOf(existingUser))
            whenever(userSaveHelper.saveUser(any())).thenAnswer { it.arguments[0] as User }

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(0, result.created)
            assertEquals(1, result.updated)
        }

        @Test
        fun `should skip users without email`() {
            // Arrange
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = null,
                    name = "Test User",
                    imageUrl = null
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(emptyList())

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.totalFromFlowcase)
            assertEquals(0, result.created)
            assertEquals(1, result.errors.size)
            assertTrue(result.errors[0].contains("uten e-post"))
        }

        @Test
        fun `should skip users without name`() {
            // Arrange
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = null,
                    imageUrl = null
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(emptyList())

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.totalFromFlowcase)
            assertEquals(0, result.created)
            assertEquals(1, result.errors.size)
            assertTrue(result.errors[0].contains("uten navn"))
        }

        @Test
        fun `should return error result when Flowcase fetch fails`() {
            // Arrange
            whenever(flowcaseService.getConsultants()).thenThrow(RuntimeException("Connection failed"))

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(0, result.totalFromFlowcase)
            assertEquals(0, result.created)
            assertEquals(1, result.errors.size)
            assertTrue(result.errors[0].contains("Flowcase"))
        }

        @Test
        fun `should not overwrite Google profile picture with Flowcase image`() {
            // Arrange
            val existingUser = User(
                id = 1L,
                email = "test@example.com",
                name = "Old Name",
                givenName = "Old",
                familyName = "Name",
                icon = "https://lh3.googleusercontent.com/profile123",
                budgets = emptyList()
            )
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = "New Name",
                    imageUrl = "https://flowcase.com/image.jpg"
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(listOf(existingUser))
            whenever(userSaveHelper.saveUser(any())).thenAnswer { it.arguments[0] as User }

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.updated)
            verify(userSaveHelper).saveUser(argThat { user ->
                user.icon == "https://lh3.googleusercontent.com/profile123"
            })
        }

        @Test
        fun `should truncate long image URLs`() {
            // Arrange
            val longUrl = "https://example.com/" + "a".repeat(300)
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = "Test User",
                    imageUrl = longUrl
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(emptyList())
            whenever(userSaveHelper.saveUser(any())).thenAnswer { it.arguments[0] as User }

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.created)
            verify(userSaveHelper).saveUser(argThat { user ->
                user.icon != null && user.icon!!.length <= 250
            })
        }

        @Test
        fun `should handle single name without family name`() {
            // Arrange
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(
                    id = "1",
                    email = "test@example.com",
                    name = "Madonna",
                    imageUrl = null
                )
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(emptyList())
            whenever(userSaveHelper.saveUser(any())).thenAnswer { it.arguments[0] as User }

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(1, result.created)
            verify(userSaveHelper).saveUser(argThat { user ->
                user.givenName == "Madonna" && user.familyName == null
            })
        }

        @Test
        fun `should continue processing after individual user error`() {
            // Arrange
            val flowcaseUsers = listOf(
                FlowcaseUserDTO(id = "1", email = "user1@example.com", name = "User One", imageUrl = null),
                FlowcaseUserDTO(id = "2", email = "user2@example.com", name = "User Two", imageUrl = null)
            )
            whenever(flowcaseService.getConsultants()).thenReturn(flowcaseUsers)
            whenever(userRepository.findAll()).thenReturn(emptyList())
            whenever(userSaveHelper.saveUser(any()))
                .thenThrow(RuntimeException("DB error"))
                .thenAnswer { it.arguments[0] as User }

            // Act
            val result = userSyncService.syncFromFlowcase()

            // Assert
            assertEquals(2, result.totalFromFlowcase)
            assertEquals(1, result.created)
            assertEquals(1, result.errors.size)
        }
    }
}
