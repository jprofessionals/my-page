package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.ActivityStatus
import no.jpro.mypageapi.entity.AvailabilityHistory
import no.jpro.mypageapi.entity.AvailabilityStatus
import no.jpro.mypageapi.entity.ClosedReason
import no.jpro.mypageapi.entity.ConsultantAvailability
import no.jpro.mypageapi.entity.Customer
import no.jpro.mypageapi.entity.SalesActivity
import no.jpro.mypageapi.entity.SalesStage
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.AvailabilityHistoryRepository
import no.jpro.mypageapi.repository.ConsultantAvailabilityRepository
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.InvoluntaryBenchDataRepository
import no.jpro.mypageapi.repository.InterviewRoundRepository
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.SalesActivityRepository
import no.jpro.mypageapi.repository.SalesStageHistoryRepository
import no.jpro.mypageapi.repository.SettingsRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.repository.YearlyConsultantCapacityRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import java.time.LocalDate
import java.util.*

@ExtendWith(MockitoExtension::class)
class SalesPipelineServiceTest {

    @Mock
    private lateinit var consultantAvailabilityRepository: ConsultantAvailabilityRepository

    @Mock
    private lateinit var availabilityHistoryRepository: AvailabilityHistoryRepository

    @Mock
    private lateinit var salesActivityRepository: SalesActivityRepository

    @Mock
    private lateinit var salesStageHistoryRepository: SalesStageHistoryRepository

    @Mock
    private lateinit var interviewRoundRepository: InterviewRoundRepository

    @Mock
    private lateinit var jobPostingRepository: JobPostingRepository

    @Mock
    private lateinit var settingsRepository: SettingsRepository

    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var customerRepository: CustomerRepository

    @Mock
    private lateinit var involuntaryBenchDataRepository: InvoluntaryBenchDataRepository

    @Mock
    private lateinit var yearlyConsultantCapacityRepository: YearlyConsultantCapacityRepository

    private lateinit var salesPipelineService: SalesPipelineService

    @BeforeEach
    fun setup() {
        salesPipelineService = SalesPipelineService(
            consultantAvailabilityRepository,
            availabilityHistoryRepository,
            salesActivityRepository,
            salesStageHistoryRepository,
            interviewRoundRepository,
            jobPostingRepository,
            settingsRepository,
            userRepository,
            customerRepository,
            involuntaryBenchDataRepository,
            yearlyConsultantCapacityRepository
        )
    }

    @Nested
    inner class GetAllConsultantAvailability {

        @Test
        fun `should return all consultant availabilities`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val availability = ConsultantAvailability(
                id = 1L,
                consultant = consultant,
                status = AvailabilityStatus.AVAILABLE
            )
            whenever(consultantAvailabilityRepository.findAll()).thenReturn(listOf(availability))

            // Act
            val result = salesPipelineService.getAllConsultantAvailability()

            // Assert
            assertEquals(1, result.size)
            assertEquals(AvailabilityStatus.AVAILABLE, result[0].status)
        }
    }

    @Nested
    inner class GetConsultantAvailability {

        @Test
        fun `should return availability for consultant`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val availability = ConsultantAvailability(
                id = 1L,
                consultant = consultant,
                status = AvailabilityStatus.OCCUPIED
            )
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(availability)

            // Act
            val result = salesPipelineService.getConsultantAvailability(1L)

            // Assert
            assertNotNull(result)
            assertEquals(AvailabilityStatus.OCCUPIED, result?.status)
        }

        @Test
        fun `should return null when consultant not on board`() {
            // Arrange
            whenever(consultantAvailabilityRepository.findByConsultantId(999L)).thenReturn(null)

            // Act
            val result = salesPipelineService.getConsultantAvailability(999L)

            // Assert
            assertNull(result)
        }
    }

    @Nested
    inner class UpdateConsultantAvailability {

        @Test
        fun `should update existing availability`() {
            // Arrange
            val consultant = createTestUserWithId(1L, "test@example.com")
            val updatedBy = createTestUser("admin@example.com")
            val existingAvailability = ConsultantAvailability(
                id = 1L,
                consultant = consultant,
                status = AvailabilityStatus.AVAILABLE
            )

            whenever(userRepository.findById(1L)).thenReturn(Optional.of(consultant))
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(existingAvailability)
            whenever(consultantAvailabilityRepository.save(any<ConsultantAvailability>())).thenAnswer { it.arguments[0] }
            whenever(availabilityHistoryRepository.save(any<AvailabilityHistory>())).thenAnswer { it.arguments[0] }

            // Act
            val result = salesPipelineService.updateConsultantAvailability(
                consultantId = 1L,
                status = AvailabilityStatus.OCCUPIED,
                availableFrom = null,
                currentCustomerId = null,
                notes = "Oppdatert",
                updatedBy = updatedBy
            )

            // Assert
            assertEquals(AvailabilityStatus.OCCUPIED, result.status)
            assertEquals("Oppdatert", result.notes)
        }

        @Test
        fun `should throw when consultant not found`() {
            // Arrange
            val updatedBy = createTestUser("admin@example.com")
            whenever(userRepository.findById(999L)).thenReturn(Optional.empty())

            // Act & Assert
            assertThrows(IllegalArgumentException::class.java) {
                salesPipelineService.updateConsultantAvailability(
                    consultantId = 999L,
                    status = AvailabilityStatus.AVAILABLE,
                    availableFrom = null,
                    currentCustomerId = null,
                    notes = null,
                    updatedBy = updatedBy
                )
            }
        }

        @Test
        fun `should log history when status changes`() {
            // Arrange
            val consultant = createTestUserWithId(1L, "test@example.com")
            val updatedBy = createTestUser("admin@example.com")
            val existingAvailability = ConsultantAvailability(
                id = 1L,
                consultant = consultant,
                status = AvailabilityStatus.AVAILABLE
            )

            whenever(userRepository.findById(1L)).thenReturn(Optional.of(consultant))
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(existingAvailability)
            whenever(consultantAvailabilityRepository.save(any<ConsultantAvailability>())).thenAnswer { it.arguments[0] }
            whenever(availabilityHistoryRepository.save(any<AvailabilityHistory>())).thenAnswer { it.arguments[0] }

            // Act
            salesPipelineService.updateConsultantAvailability(
                consultantId = 1L,
                status = AvailabilityStatus.OCCUPIED,
                availableFrom = null,
                currentCustomerId = null,
                notes = null,
                updatedBy = updatedBy
            )

            // Assert
            verify(availabilityHistoryRepository).save(argThat<AvailabilityHistory> { history ->
                history.fromStatus == AvailabilityStatus.AVAILABLE &&
                history.toStatus == AvailabilityStatus.OCCUPIED
            })
        }
    }

    @Nested
    inner class AddConsultantToBoard {

        @Test
        fun `should add consultant to board by id`() {
            // Arrange
            val consultant = createTestUserWithId(1L, "test@example.com")
            val addedBy = createTestUser("admin@example.com")

            whenever(userRepository.findById(1L)).thenReturn(Optional.of(consultant))
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(null)
            whenever(consultantAvailabilityRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(emptyList())
            whenever(consultantAvailabilityRepository.save(any<ConsultantAvailability>())).thenAnswer { it.arguments[0] }
            whenever(availabilityHistoryRepository.save(any<AvailabilityHistory>())).thenAnswer { it.arguments[0] }

            // Act
            val result = salesPipelineService.addConsultantToBoard(
                consultantId = 1L,
                flowcaseEmail = null,
                flowcaseName = null,
                status = AvailabilityStatus.AVAILABLE,
                notes = "Ny konsulent",
                addedBy = addedBy
            )

            // Assert
            assertEquals(AvailabilityStatus.AVAILABLE, result.status)
            assertEquals("Ny konsulent", result.notes)
        }

        @Test
        fun `should throw when consultant already on board`() {
            // Arrange
            val consultant = createTestUserWithId(1L, "test@example.com")
            val addedBy = createTestUser("admin@example.com")
            val existingAvailability = ConsultantAvailability(
                id = 1L,
                consultant = consultant,
                status = AvailabilityStatus.AVAILABLE
            )

            whenever(userRepository.findById(1L)).thenReturn(Optional.of(consultant))
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(existingAvailability)

            // Act & Assert
            assertThrows(IllegalStateException::class.java) {
                salesPipelineService.addConsultantToBoard(
                    consultantId = 1L,
                    flowcaseEmail = null,
                    flowcaseName = null,
                    status = null,
                    notes = null,
                    addedBy = addedBy
                )
            }
        }

        @Test
        fun `should throw when neither consultantId nor flowcaseEmail provided`() {
            // Arrange
            val addedBy = createTestUser("admin@example.com")

            // Act & Assert
            assertThrows(IllegalArgumentException::class.java) {
                salesPipelineService.addConsultantToBoard(
                    consultantId = null,
                    flowcaseEmail = null,
                    flowcaseName = null,
                    status = null,
                    notes = null,
                    addedBy = addedBy
                )
            }
        }
    }

    @Nested
    inner class GetAllSalesActivities {

        @Test
        fun `should return all activities when no status filter`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val activity = createSalesActivity(1L, consultant)
            whenever(salesActivityRepository.findAll()).thenReturn(listOf(activity))

            // Act
            val result = salesPipelineService.getAllSalesActivities(status = null)

            // Assert
            assertEquals(1, result.size)
        }

        @Test
        fun `should return filtered activities by status`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val activity = createSalesActivity(1L, consultant)
            whenever(salesActivityRepository.findByStatus(ActivityStatus.ACTIVE)).thenReturn(listOf(activity))

            // Act
            val result = salesPipelineService.getAllSalesActivities(status = ActivityStatus.ACTIVE)

            // Assert
            assertEquals(1, result.size)
        }
    }

    @Nested
    inner class CreateSalesActivity {

        @Test
        fun `should create sales activity with consultant id`() {
            // Arrange
            val consultant = createTestUserWithId(1L, "test@example.com")
            val createdBy = createTestUser("admin@example.com")

            whenever(userRepository.findById(1L)).thenReturn(Optional.of(consultant))
            whenever(salesActivityRepository.save(any<SalesActivity>())).thenAnswer {
                val activity = it.arguments[0] as SalesActivity
                activity.apply { id = 1L }
            }

            // Act
            val result = salesPipelineService.createSalesActivity(
                consultantId = 1L,
                flowcaseEmail = null,
                flowcaseName = null,
                customerId = null,
                customerName = "Test Kunde",
                supplierName = null,
                title = "Senior Utvikler",
                stage = SalesStage.INTERESTED,
                notes = "Interessert i oppdraget",
                maxPrice = 1200,
                offeredPrice = null,
                expectedStartDate = LocalDate.of(2025, 3, 1),
                offerDeadline = null,
                offerDeadlineAsap = false,
                interviewDate = null,
                createdBy = createdBy
            )

            // Assert
            assertEquals(1L, result.id)
            assertEquals("Senior Utvikler", result.title)
            assertEquals(SalesStage.INTERESTED, result.currentStage)
        }

        @Test
        fun `should throw when consultant not found`() {
            // Arrange
            val createdBy = createTestUser("admin@example.com")
            whenever(userRepository.findById(999L)).thenReturn(Optional.empty())

            // Act & Assert
            assertThrows(IllegalArgumentException::class.java) {
                salesPipelineService.createSalesActivity(
                    consultantId = 999L,
                    flowcaseEmail = null,
                    flowcaseName = null,
                    customerId = null,
                    customerName = "Test",
                    supplierName = null,
                    title = "Test",
                    stage = SalesStage.INTERESTED,
                    notes = null,
                    maxPrice = null,
                    offeredPrice = null,
                    expectedStartDate = null,
                    offerDeadline = null,
                    offerDeadlineAsap = null,
                    interviewDate = null,
                    createdBy = createdBy
                )
            }
        }
    }

    @Nested
    inner class UpdateSalesActivityStage {

        @Test
        fun `should update activity stage`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val changedBy = createTestUser("admin@example.com")
            val activity = createSalesActivity(1L, consultant)

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))
            whenever(salesActivityRepository.save(any<SalesActivity>())).thenAnswer { it.arguments[0] }

            // Act
            val result = salesPipelineService.updateSalesActivityStage(
                id = 1L,
                newStage = SalesStage.SENT_TO_CUSTOMER,
                changedBy = changedBy
            )

            // Assert
            assertEquals(SalesStage.SENT_TO_CUSTOMER, result.currentStage)
        }

        @Test
        fun `should not change when same stage`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val changedBy = createTestUser("admin@example.com")
            val activity = createSalesActivity(1L, consultant).apply {
                currentStage = SalesStage.INTERVIEW
            }

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))

            // Act
            val result = salesPipelineService.updateSalesActivityStage(
                id = 1L,
                newStage = SalesStage.INTERVIEW,
                changedBy = changedBy
            )

            // Assert
            verify(salesActivityRepository, never()).save(any())
        }

        @Test
        fun `should throw when activity is closed`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val changedBy = createTestUser("admin@example.com")
            val activity = createSalesActivity(1L, consultant).apply {
                status = ActivityStatus.WON
            }

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))

            // Act & Assert
            assertThrows(IllegalStateException::class.java) {
                salesPipelineService.updateSalesActivityStage(
                    id = 1L,
                    newStage = SalesStage.SENT_TO_CUSTOMER,
                    changedBy = changedBy
                )
            }
        }
    }

    @Nested
    inner class MarkActivityWon {

        @Test
        fun `should mark activity as won`() {
            // Arrange
            val consultant = createTestUserWithId(1L, "test@example.com")
            val changedBy = createTestUser("admin@example.com")
            val activity = createSalesActivity(1L, consultant)

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))
            whenever(salesActivityRepository.save(any<SalesActivity>())).thenAnswer { it.arguments[0] }
            whenever(salesActivityRepository.findOtherActiveByConsultantId(1L, 1L)).thenReturn(emptyList())
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(null)

            // Act
            val result = salesPipelineService.markActivityWon(1L, changedBy)

            // Assert
            assertEquals(ActivityStatus.WON, result.status)
            assertNotNull(result.closedAt)
        }

        @Test
        fun `should close other active activities when consultant wins`() {
            // Arrange
            val consultant = createTestUserWithId(1L, "test@example.com")
            val changedBy = createTestUser("admin@example.com")
            val wonActivity = createSalesActivity(1L, consultant)
            val otherActivity = createSalesActivity(2L, consultant)

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(wonActivity))
            whenever(salesActivityRepository.save(any<SalesActivity>())).thenAnswer { it.arguments[0] }
            whenever(salesActivityRepository.findOtherActiveByConsultantId(1L, 1L)).thenReturn(listOf(otherActivity))
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(null)

            // Act
            salesPipelineService.markActivityWon(1L, changedBy)

            // Assert
            verify(salesActivityRepository, times(2)).save(any())
        }

        @Test
        fun `should throw when activity already closed`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val changedBy = createTestUser("admin@example.com")
            val activity = createSalesActivity(1L, consultant).apply {
                status = ActivityStatus.WON
            }

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))

            // Act & Assert
            assertThrows(IllegalStateException::class.java) {
                salesPipelineService.markActivityWon(1L, changedBy)
            }
        }
    }

    @Nested
    inner class CloseActivity {

        @Test
        fun `should close activity with reason`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val closedBy = createTestUser("admin@example.com")
            val activity = createSalesActivity(1L, consultant)

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))
            whenever(salesActivityRepository.save(any<SalesActivity>())).thenAnswer { it.arguments[0] }

            // Act
            val result = salesPipelineService.closeActivity(
                id = 1L,
                reason = ClosedReason.LOST_AT_CUSTOMER,
                reasonNote = "Tapt til konkurrent",
                closedBy = closedBy
            )

            // Assert
            assertEquals(ActivityStatus.CLOSED_OTHER_WON, result.status)
            assertEquals(ClosedReason.LOST_AT_CUSTOMER, result.closedReason)
            assertEquals("Tapt til konkurrent", result.closedReasonNote)
            assertNotNull(result.closedAt)
        }

        @Test
        fun `should throw when activity already closed`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val closedBy = createTestUser("admin@example.com")
            val activity = createSalesActivity(1L, consultant).apply {
                status = ActivityStatus.WON
            }

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))

            // Act & Assert
            assertThrows(IllegalStateException::class.java) {
                salesPipelineService.closeActivity(
                    id = 1L,
                    reason = ClosedReason.LOST_AT_CUSTOMER,
                    reasonNote = null,
                    closedBy = closedBy
                )
            }
        }
    }

    @Nested
    inner class DeleteActivity {

        @Test
        fun `should delete activity`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val activity = createSalesActivity(1L, consultant)

            whenever(salesActivityRepository.findById(1L)).thenReturn(Optional.of(activity))

            // Act
            salesPipelineService.deleteActivity(1L)

            // Assert
            verify(salesActivityRepository).delete(activity)
        }

        @Test
        fun `should throw when activity not found`() {
            // Arrange
            whenever(salesActivityRepository.findById(999L)).thenReturn(Optional.empty())

            // Act & Assert
            assertThrows(IllegalArgumentException::class.java) {
                salesPipelineService.deleteActivity(999L)
            }
        }
    }

    @Nested
    inner class RemoveConsultantFromPipeline {

        @Test
        fun `should remove consultant from pipeline`() {
            // Arrange
            val consultant = createTestUser("test@example.com")
            val availability = ConsultantAvailability(
                id = 1L,
                consultant = consultant,
                status = AvailabilityStatus.AVAILABLE
            )

            whenever(userRepository.existsById(1L)).thenReturn(true)
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(availability)

            // Act
            val result = salesPipelineService.removeConsultantFromPipeline(1L)

            // Assert
            assertTrue(result)
            verify(consultantAvailabilityRepository).delete(availability)
        }

        @Test
        fun `should return false when consultant not on board`() {
            // Arrange
            whenever(userRepository.existsById(1L)).thenReturn(true)
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(null)

            // Act
            val result = salesPipelineService.removeConsultantFromPipeline(1L)

            // Assert
            assertFalse(result)
        }

        @Test
        fun `should throw when consultant not found`() {
            // Arrange
            whenever(userRepository.existsById(999L)).thenReturn(false)

            // Act & Assert
            assertThrows(IllegalArgumentException::class.java) {
                salesPipelineService.removeConsultantFromPipeline(999L)
            }
        }
    }

    @Nested
    inner class ReorderConsultants {

        @Test
        fun `should reorder consultants`() {
            // Arrange
            val consultant1 = createTestUserWithId(1L, "test1@example.com")
            val consultant2 = createTestUserWithId(2L, "test2@example.com")
            val availability1 = ConsultantAvailability(id = 1L, consultant = consultant1, status = AvailabilityStatus.AVAILABLE, displayOrder = 1)
            val availability2 = ConsultantAvailability(id = 2L, consultant = consultant2, status = AvailabilityStatus.AVAILABLE, displayOrder = 0)

            whenever(consultantAvailabilityRepository.findByConsultantId(2L)).thenReturn(availability2)
            whenever(consultantAvailabilityRepository.findByConsultantId(1L)).thenReturn(availability1)
            whenever(consultantAvailabilityRepository.save(any<ConsultantAvailability>())).thenAnswer { it.arguments[0] }

            // Act
            salesPipelineService.reorderConsultants(listOf(2L, 1L))

            // Assert
            verify(consultantAvailabilityRepository, times(2)).save(any())
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

    private fun createTestUserWithId(id: Long, email: String): User {
        return User(
            id = id,
            email = email,
            name = "Test User",
            givenName = "Test",
            familyName = "User",
            budgets = emptyList()
        )
    }

    private fun createSalesActivity(id: Long, consultant: User): SalesActivity {
        return SalesActivity(
            id = id,
            consultant = consultant,
            title = "Test Aktivitet",
            currentStage = SalesStage.INTERESTED,
            status = ActivityStatus.ACTIVE
        )
    }
}
