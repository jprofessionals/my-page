package no.jpro.mypageapi.service

import jakarta.persistence.EntityNotFoundException
import no.jpro.mypageapi.entity.Customer
import no.jpro.mypageapi.entity.JobPostingSource
import no.jpro.mypageapi.entity.NotificationTask
import no.jpro.mypageapi.entity.Tag
import no.jpro.mypageapi.model.JobPosting as JobPostingModel
import no.jpro.mypageapi.model.Customer as CustomerModel
import no.jpro.mypageapi.model.Tag as TagModel
import no.jpro.mypageapi.entity.JobPosting as JobPostingEntity
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.NotificationTaskRepository
import no.jpro.mypageapi.repository.TagRepository
import no.jpro.mypageapi.service.slack.SlackService
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import java.net.URI
import java.time.OffsetDateTime
import java.util.*

@ExtendWith(MockitoExtension::class)
class JobPostingServiceTest {

    @Mock
    private lateinit var customerRepository: CustomerRepository

    @Mock
    private lateinit var tagRepository: TagRepository

    @Mock
    private lateinit var jobPostingRepository: JobPostingRepository

    @Mock
    private lateinit var notificationTaskRepository: NotificationTaskRepository

    @Mock
    private lateinit var slackService: SlackService

    private lateinit var jobPostingService: JobPostingService

    @BeforeEach
    fun setup() {
        jobPostingService = JobPostingService(
            customerRepository,
            tagRepository,
            jobPostingRepository,
            notificationTaskRepository,
            slackService,
            "test-channel"
        )
    }

    @Nested
    inner class CreateJobPosting {

        @Test
        fun `should create job posting with existing customer`() {
            // Arrange
            val existingCustomer = Customer(id = 1L, name = "Test Kunde")
            val jobPostingModel = createJobPostingModel("Senior Utvikler", "Test Kunde")

            whenever(customerRepository.findByName("Test Kunde")).thenReturn(existingCustomer)
            whenever(tagRepository.findByName(any())).thenReturn(null)
            whenever(tagRepository.save(any<Tag>())).thenAnswer {
                val tag = it.arguments[0] as Tag
                Tag(id = 1L, name = tag.name)
            }
            whenever(jobPostingRepository.save(any<JobPostingEntity>())).thenAnswer {
                val entity = it.arguments[0] as JobPostingEntity
                entity.apply { id = 1L }
            }
            whenever(notificationTaskRepository.save(any<NotificationTask>())).thenAnswer { it.arguments[0] }

            // Act
            val result = jobPostingService.createJobPosting(notify = false, jobPosting = jobPostingModel)

            // Assert
            assertEquals(1L, result.id)
            assertEquals("Senior Utvikler", result.title)
            verify(customerRepository, never()).save(any())
        }

        @Test
        fun `should create job posting and new customer when customer does not exist`() {
            // Arrange
            val jobPostingModel = createJobPostingModel("Senior Utvikler", "Ny Kunde")

            whenever(customerRepository.findByName("Ny Kunde")).thenReturn(null)
            whenever(customerRepository.save(any<Customer>())).thenAnswer {
                val customer = it.arguments[0] as Customer
                Customer(id = 1L, name = customer.name)
            }
            whenever(tagRepository.findByName(any())).thenReturn(null)
            whenever(tagRepository.save(any<Tag>())).thenAnswer {
                val tag = it.arguments[0] as Tag
                Tag(id = 1L, name = tag.name)
            }
            whenever(jobPostingRepository.save(any<JobPostingEntity>())).thenAnswer {
                val entity = it.arguments[0] as JobPostingEntity
                entity.apply { id = 1L }
            }
            whenever(notificationTaskRepository.save(any<NotificationTask>())).thenAnswer { it.arguments[0] }

            // Act
            val result = jobPostingService.createJobPosting(notify = false, jobPosting = jobPostingModel)

            // Assert
            assertNotNull(result)
            verify(customerRepository).save(argThat<Customer> { customer ->
                customer.name == "Ny Kunde"
            })
        }

        @Test
        fun `should send slack notification when notify is true`() {
            // Arrange
            val existingCustomer = Customer(id = 1L, name = "Test Kunde")
            val jobPostingModel = createJobPostingModel("Senior Utvikler", "Test Kunde")

            whenever(customerRepository.findByName("Test Kunde")).thenReturn(existingCustomer)
            whenever(tagRepository.findByName(any())).thenReturn(null)
            whenever(tagRepository.save(any<Tag>())).thenAnswer {
                val tag = it.arguments[0] as Tag
                Tag(id = 1L, name = tag.name)
            }
            whenever(jobPostingRepository.save(any<JobPostingEntity>())).thenAnswer {
                val entity = it.arguments[0] as JobPostingEntity
                entity.apply { id = 1L }
            }
            whenever(notificationTaskRepository.save(any<NotificationTask>())).thenAnswer { it.arguments[0] }

            // Act
            jobPostingService.createJobPosting(notify = true, jobPosting = jobPostingModel)

            // Assert
            verify(slackService).postJobPosting(eq("test-channel"), any(), anyOrNull())
        }

        @Test
        fun `should not fail when slack notification fails`() {
            // Arrange
            val existingCustomer = Customer(id = 1L, name = "Test Kunde")
            val jobPostingModel = createJobPostingModel("Senior Utvikler", "Test Kunde")

            whenever(customerRepository.findByName("Test Kunde")).thenReturn(existingCustomer)
            whenever(tagRepository.findByName(any())).thenReturn(null)
            whenever(tagRepository.save(any<Tag>())).thenAnswer {
                val tag = it.arguments[0] as Tag
                Tag(id = 1L, name = tag.name)
            }
            whenever(jobPostingRepository.save(any<JobPostingEntity>())).thenAnswer {
                val entity = it.arguments[0] as JobPostingEntity
                entity.apply { id = 1L }
            }
            whenever(notificationTaskRepository.save(any<NotificationTask>())).thenAnswer { it.arguments[0] }
            whenever(slackService.postJobPosting(any(), any(), anyOrNull())).thenThrow(RuntimeException("Slack error"))

            // Act - should not throw
            val result = jobPostingService.createJobPosting(notify = true, jobPosting = jobPostingModel)

            // Assert
            assertNotNull(result)
        }

        @Test
        fun `should use existing tags when available`() {
            // Arrange
            val existingCustomer = Customer(id = 1L, name = "Test Kunde")
            val existingTag = Tag(id = 1L, name = "Kotlin")
            val jobPostingModel = createJobPostingModel("Senior Utvikler", "Test Kunde", listOf("Kotlin"))

            whenever(customerRepository.findByName("Test Kunde")).thenReturn(existingCustomer)
            whenever(tagRepository.findByName("Kotlin")).thenReturn(existingTag)
            whenever(jobPostingRepository.save(any<JobPostingEntity>())).thenAnswer {
                val entity = it.arguments[0] as JobPostingEntity
                entity.apply { id = 1L }
            }
            whenever(notificationTaskRepository.save(any<NotificationTask>())).thenAnswer { it.arguments[0] }

            // Act
            jobPostingService.createJobPosting(notify = false, jobPosting = jobPostingModel)

            // Assert
            verify(tagRepository, never()).save(any())
        }
    }

    @Nested
    inner class DeleteJobPosting {

        @Test
        fun `should delete job posting by id`() {
            // Arrange
            val jobPostingId = 123L

            // Act
            jobPostingService.deleteJobPosting(jobPostingId)

            // Assert
            verify(jobPostingRepository).deleteById(jobPostingId)
        }
    }

    @Nested
    inner class GetJobPostingTags {

        @Test
        fun `should return all tags`() {
            // Arrange
            val tags = listOf(
                Tag(id = 1L, name = "Kotlin"),
                Tag(id = 2L, name = "Java")
            )
            whenever(tagRepository.findAll()).thenReturn(tags)

            // Act
            val result = jobPostingService.getJobPostingTags()

            // Assert
            assertEquals(2, result.size)
            assertTrue(result.any { it.name == "Kotlin" })
            assertTrue(result.any { it.name == "Java" })
        }
    }

    @Nested
    inner class GetJobPostings {

        @Test
        fun `should return filtered job postings`() {
            // Arrange
            val customer = Customer(id = 1L, name = "Test Kunde")
            val jobPosting = JobPostingEntity(
                title = "Test",
                customer = customer,
                description = "Description"
            )
            whenever(jobPostingRepository.findAllWithFilters(
                eq(listOf("Test Kunde")),
                isNull(),
                eq(false),
                eq(emptyList()),
                eq(emptyList())
            )).thenReturn(listOf(jobPosting))

            // Act
            val result = jobPostingService.getJobPostings(
                customers = listOf("Test Kunde"),
                fromDateTime = null,
                hidden = false,
                includeIds = emptyList(),
                tags = emptyList()
            )

            // Assert
            assertEquals(1, result.size)
        }
    }

    @Nested
    inner class GetJobPostingCustomers {

        @Test
        fun `should return all customers`() {
            // Arrange
            val customers = listOf(
                Customer(id = 1L, name = "Kunde A"),
                Customer(id = 2L, name = "Kunde B")
            )
            whenever(customerRepository.findAll()).thenReturn(customers)

            // Act
            val result = jobPostingService.getJobPostingCustomers()

            // Assert
            assertEquals(2, result.size)
        }
    }

    @Nested
    inner class NotifyJobPosting {

        @Test
        fun `should send notification for existing job posting`() {
            // Arrange
            val customer = Customer(id = 1L, name = "Test Kunde")
            val jobPosting = JobPostingEntity(
                id = 1L,
                title = "Test",
                customer = customer,
                description = "Description"
            )
            whenever(jobPostingRepository.findById(1L)).thenReturn(Optional.of(jobPosting))

            // Act
            jobPostingService.notifyJobPosting(1L)

            // Assert
            verify(slackService).postJobPosting(eq("test-channel"), eq(jobPosting), anyOrNull())
        }

        @Test
        fun `should throw when job posting not found`() {
            // Arrange
            whenever(jobPostingRepository.findById(999L)).thenReturn(Optional.empty())

            // Act & Assert
            assertThrows(EntityNotFoundException::class.java) {
                jobPostingService.notifyJobPosting(999L)
            }
        }
    }

    @Nested
    inner class UpdateJobPosting {

        @Test
        fun `should update existing job posting`() {
            // Arrange
            val existingCustomer = Customer(id = 1L, name = "Eksisterende Kunde")
            val existingJobPosting = JobPostingEntity(
                id = 1L,
                title = "Gammel Tittel",
                customer = existingCustomer,
                description = "Gammel beskrivelse"
            )
            val updatedModel = createJobPostingModel("Ny Tittel", "Eksisterende Kunde")
                .copy(id = 1L, description = "Ny beskrivelse")

            whenever(jobPostingRepository.findById(1L)).thenReturn(Optional.of(existingJobPosting))
            whenever(customerRepository.findByName("Eksisterende Kunde")).thenReturn(existingCustomer)
            whenever(tagRepository.findByName(any())).thenReturn(null)
            whenever(tagRepository.save(any<Tag>())).thenAnswer {
                val tag = it.arguments[0] as Tag
                Tag(id = 1L, name = tag.name)
            }
            whenever(jobPostingRepository.save(any<JobPostingEntity>())).thenAnswer { it.arguments[0] }

            // Act
            jobPostingService.updateJobPosting(updatedModel, updateMessage = null)

            // Assert
            verify(jobPostingRepository).save(argThat<JobPostingEntity> { entity ->
                entity.title == "Ny Tittel" && entity.description == "Ny beskrivelse"
            })
        }

        @Test
        fun `should throw when job posting not found for update`() {
            // Arrange
            val jobPostingModel = createJobPostingModel("Test", "Test").copy(id = 999L)
            whenever(jobPostingRepository.findById(999L)).thenReturn(Optional.empty())

            // Act & Assert
            assertThrows(EntityNotFoundException::class.java) {
                jobPostingService.updateJobPosting(jobPostingModel, updateMessage = null)
            }
        }

        @Test
        fun `should send slack update when update message is provided`() {
            // Arrange
            val existingCustomer = Customer(id = 1L, name = "Kunde")
            val existingJobPosting = JobPostingEntity(
                id = 1L,
                title = "Tittel",
                customer = existingCustomer,
                description = "Beskrivelse"
            )
            val updatedModel = createJobPostingModel("Ny Tittel", "Kunde").copy(id = 1L)

            whenever(jobPostingRepository.findById(1L)).thenReturn(Optional.of(existingJobPosting))
            whenever(customerRepository.findByName("Kunde")).thenReturn(existingCustomer)
            whenever(tagRepository.findByName(any())).thenReturn(null)
            whenever(tagRepository.save(any<Tag>())).thenAnswer {
                val tag = it.arguments[0] as Tag
                Tag(id = 1L, name = tag.name)
            }
            whenever(jobPostingRepository.save(any<JobPostingEntity>())).thenAnswer { it.arguments[0] }

            // Act
            jobPostingService.updateJobPosting(updatedModel, updateMessage = "Oppdatert frist")

            // Assert
            verify(slackService).postJobPostingUpdate(
                eq("utlysninger"),
                any(),
                eq("Oppdatert frist")
            )
        }
    }

    private fun createJobPostingModel(
        title: String,
        customerName: String,
        tagNames: List<String> = listOf("Kotlin")
    ): JobPostingModel {
        return JobPostingModel(
            id = 0L,
            title = title,
            customer = CustomerModel(id = 0L, name = customerName, sector = no.jpro.mypageapi.model.CustomerSector.UNKNOWN),
            urgent = false,
            hidden = false,
            description = "Test beskrivelse",
            tags = tagNames.map { TagModel(id = 0L, name = it) },
            links = listOf(URI("https://example.com"))
        )
    }
}
