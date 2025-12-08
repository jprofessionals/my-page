package no.jpro.mypageapi.integration.salespipeline

import no.jpro.mypageapi.entity.Customer
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.model.CreateSalesActivity
import no.jpro.mypageapi.model.SalesActivity
import no.jpro.mypageapi.model.SalesActivityWithHistory
import no.jpro.mypageapi.model.SalesPipelineBoard
import no.jpro.mypageapi.model.SalesStage
import no.jpro.mypageapi.model.UpdateStage
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.SalesActivityRepository
import no.jpro.mypageapi.repository.SalesStageHistoryRepository
import no.jpro.mypageapi.repository.ConsultantAvailabilityRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

class SalesPipelineTest : IntegrationTestBase() {

    @Autowired
    lateinit var salesActivityRepository: SalesActivityRepository

    @Autowired
    lateinit var salesStageHistoryRepository: SalesStageHistoryRepository

    @Autowired
    lateinit var customerRepository: CustomerRepository

    @Autowired
    lateinit var consultantAvailabilityRepository: ConsultantAvailabilityRepository

    lateinit var customer: Customer

    @BeforeEach
    fun setup() {
        // Clean up sales data that references users (must be done before IntegrationTestBase cleans users)
        cleanupSalesData()
        customer = customerRepository.save(Customer(name = "Test Customer"))
    }

    @AfterEach
    fun cleanup() {
        // Clean up after each test to avoid foreign key constraints
        cleanupSalesData()
    }

    private fun cleanupSalesData() {
        salesStageHistoryRepository.deleteAll()
        salesActivityRepository.deleteAll()
        consultantAvailabilityRepository.deleteAll()
    }

    @Nested
    inner class CreateSalesActivityTests {
        @Test
        fun `admin can create sales activity`() {
            val createRequest = CreateSalesActivity(
                consultantId = user.id!!,
                title = "Oppdrag hos TestKunde",
                customerId = customer.id,
                currentStage = SalesStage.INTERESTED,
                notes = "Initial contact made"
            )

            val response = restClient(authenticated = true, asAdmin = true)
                .postForEntity<SalesActivity>(
                    uri = "/sales-activities",
                    request = createRequest
                )

            assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.title).isEqualTo("Oppdrag hos TestKunde")
            assertThat(response.body!!.currentStage).isEqualTo(SalesStage.INTERESTED)
            assertThat(response.body!!.consultant.email).isEqualTo(user.email)
            assertThat(response.body!!.customer?.name).isEqualTo("Test Customer")

            // Verify in database
            val activities = salesActivityRepository.findAll()
            assertThat(activities).hasSize(1)

            // Verify history was created
            val history = salesStageHistoryRepository.findByActivityId(activities[0].id)
            assertThat(history).hasSize(1)
            assertThat(history[0].fromStage).isNull()
            assertThat(history[0].toStage).isEqualTo(no.jpro.mypageapi.entity.SalesStage.INTERESTED)
        }

        @Test
        fun `non-admin cannot create sales activity`() {
            val createRequest = CreateSalesActivity(
                consultantId = user.id!!,
                title = "Oppdrag hos TestKunde"
            )

            val response = restClient(authenticated = true, asAdmin = false)
                .postForEntity<String>(
                    uri = "/sales-activities",
                    request = createRequest
                )

            assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
        }

        @Test
        fun `unauthenticated user cannot create sales activity`() {
            val createRequest = CreateSalesActivity(
                consultantId = user.id!!,
                title = "Oppdrag hos TestKunde"
            )

            val response = restClient(authenticated = false)
                .postForEntity<String>(
                    uri = "/sales-activities",
                    request = createRequest
                )

            assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        }
    }

    @Nested
    inner class GetSalesActivityTests {
        @Test
        fun `can get sales activity with history`() {
            // Create activity
            val createRequest = CreateSalesActivity(
                consultantId = user.id!!,
                title = "Oppdrag hos TestKunde",
                customerId = customer.id
            )

            val createResponse = restClient(authenticated = true, asAdmin = true)
                .postForEntity<SalesActivity>(
                    uri = "/sales-activities",
                    request = createRequest
                )

            assertThat(createResponse.statusCode).isEqualTo(HttpStatus.CREATED)
            val activityId = createResponse.body!!.id

            // Get activity with history
            val response = restClient(authenticated = true, asAdmin = false)
                .getForEntity<SalesActivityWithHistory>(
                    uri = "/sales-activities/$activityId"
                )

            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.stageHistory).hasSize(1)
        }
    }

    @Nested
    inner class UpdateStageTests {
        @Test
        fun `admin can update sales activity stage`() {
            // Create activity
            val createRequest = CreateSalesActivity(
                consultantId = user.id!!,
                title = "Oppdrag hos TestKunde"
            )

            val createResponse = restClient(authenticated = true, asAdmin = true)
                .postForEntity<SalesActivity>(
                    uri = "/sales-activities",
                    request = createRequest
                )

            val activityId = createResponse.body!!.id

            // Update stage
            val updateRequest = UpdateStage(stage = SalesStage.SENT_TO_SUPPLIER)

            val response = restClient(authenticated = true, asAdmin = true)
                .putForEntity<SalesActivity>(
                    uri = "/sales-activities/$activityId/stage",
                    request = updateRequest
                )

            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body!!.currentStage).isEqualTo(SalesStage.SENT_TO_SUPPLIER)

            // Verify history
            val history = salesStageHistoryRepository.findByActivityId(activityId)
            assertThat(history).hasSize(2)
            // One entry should be the initial creation (fromStage=null, toStage=INTERESTED)
            // One entry should be the stage update (fromStage=INTERESTED, toStage=SENT_TO_SUPPLIER)
            val initialEntry = history.find { it.fromStage == null }
            assertThat(initialEntry).isNotNull
            assertThat(initialEntry!!.toStage).isEqualTo(no.jpro.mypageapi.entity.SalesStage.INTERESTED)
            val updateEntry = history.find { it.fromStage == no.jpro.mypageapi.entity.SalesStage.INTERESTED }
            assertThat(updateEntry).isNotNull
            assertThat(updateEntry!!.toStage).isEqualTo(no.jpro.mypageapi.entity.SalesStage.SENT_TO_SUPPLIER)
        }
    }

    @Nested
    inner class GetPipelineBoardTests {
        @Test
        fun `can get pipeline board`() {
            // Create some activities
            val createRequest = CreateSalesActivity(
                consultantId = user.id!!,
                title = "Oppdrag hos TestKunde"
            )

            restClient(authenticated = true, asAdmin = true)
                .postForEntity<SalesActivity>(
                    uri = "/sales-activities",
                    request = createRequest
                )

            // Get board
            val response = restClient(authenticated = true, asAdmin = false)
                .getForEntity<SalesPipelineBoard>(
                    uri = "/sales-activities/board"
                )

            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.stages).hasSize(5) // All SalesStage values (INTERESTED, SENT_TO_SUPPLIER, SENT_TO_CUSTOMER, INTERVIEW, LOST)
            assertThat(response.body!!.consultants).hasSize(1)
            assertThat(response.body!!.consultants[0].activities).hasSize(1)
        }
    }
}
