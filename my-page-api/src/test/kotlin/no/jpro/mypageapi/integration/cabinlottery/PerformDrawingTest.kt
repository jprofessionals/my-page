package no.jpro.mypageapi.integration.cabinlottery

import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.model.DrawingResult
import no.jpro.mypageapi.repository.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import java.time.LocalDate

class PerformDrawingTest(
    @Autowired private val drawingRepository: CabinDrawingRepository,
    @Autowired private val periodRepository: CabinPeriodRepository,
    @Autowired private val wishRepository: CabinWishRepository,
    @Autowired private val allocationRepository: CabinAllocationRepository,
    @Autowired private val executionRepository: CabinDrawingExecutionRepository,
    @Autowired private val apartmentRepository: ApartmentRepository,
) : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        allocationRepository.deleteAll()
        executionRepository.deleteAll()
        wishRepository.deleteAll()
        periodRepository.deleteAll()
        drawingRepository.deleteAll()
        apartmentRepository.deleteAll()
    }

    @Test
    fun `should perform drawing and return results`() {
        // Arrange - Create drawing with LOCKED status
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.LOCKED
            )
        )

        // Create apartments
        val apt1 = apartmentRepository.save(Apartment(cabin_name = "Hytte 1", sort_order = 1))
        val apt2 = apartmentRepository.save(Apartment(cabin_name = "Hytte 2", sort_order = 2))

        // Create period
        val period = periodRepository.save(
            CabinPeriod(
                drawing = drawing,
                startDate = LocalDate.of(2025, 6, 1),
                endDate = LocalDate.of(2025, 6, 8),
                description = "Uke 23",
                sortOrder = 1
            )
        )

        // Create wishes for user
        wishRepository.save(
            CabinWish(
                drawing = drawing,
                user = user,
                period = period,
                priority = 1,
                desiredApartments = listOf(apt1, apt2)
            )
        )

        // Act - Perform drawing with specific seed for reproducibility
        val url = "/cabin-lottery/admin/drawings/${drawing.id}/draw?seed=12345"
        val response = restClient(authenticated = true, asAdmin = true)
            .postForEntity<DrawingResult>(uri = url, null)

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val result = response.body!!

        assertThat(result.drawingId).isEqualTo(drawing.id)
        assertThat(result.season).isEqualTo("Test 2025")
        assertThat(result.executionId).isNotNull
        assertThat(result.allocations).isNotEmpty
        assertThat(result.statistics).isNotNull
        assertThat(result.statistics.totalParticipants).isEqualTo(1)
        assertThat(result.auditLog).isNotEmpty
    }

    @Test
    fun `should fail when drawing is not locked`() {
        // Arrange - Create drawing with DRAFT status
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.DRAFT
            )
        )

        // Act - Try to perform drawing
        val url = "/cabin-lottery/admin/drawings/${drawing.id}/draw"
        val response = restClient(authenticated = true, asAdmin = true)
            .postForEntity<String>(uri = url, null)

        // Assert - Should fail with 409 CONFLICT (drawing not in correct state)
        assertThat(response.statusCode).isEqualTo(HttpStatus.CONFLICT)
    }

    @Test
    fun `should require admin authentication`() {
        // Arrange
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.LOCKED
            )
        )

        // Act - Try to perform drawing without admin
        val url = "/cabin-lottery/admin/drawings/${drawing.id}/draw"
        val response = restClient(authenticated = false)
            .postForEntity<String>(uri = url, null)

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }
}