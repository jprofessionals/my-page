package no.jpro.mypageapi.integration.cabinlottery

import no.jpro.mypageapi.dto.CabinAllocationDTO
import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.*
import no.jpro.mypageapi.service.CabinLotteryService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.time.LocalDate
import java.util.*

class GetAllocationsTest(
    @Autowired private val drawingRepository: CabinDrawingRepository,
    @Autowired private val periodRepository: CabinPeriodRepository,
    @Autowired private val wishRepository: CabinWishRepository,
    @Autowired private val allocationRepository: CabinAllocationRepository,
    @Autowired private val executionRepository: CabinDrawingExecutionRepository,
    @Autowired private val apartmentRepository: ApartmentRepository,
    @Autowired private val lotteryService: CabinLotteryService,
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
    fun `should return allocations from published execution when no executionId is specified`() {
        // Arrange - Create drawing
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

        // Create wishes
        wishRepository.save(
            CabinWish(
                drawing = drawing,
                user = user,
                period = period,
                priority = 1,
                desiredApartments = listOf(apt1, apt2)
            )
        )

        // Perform two draws with different seeds
        val firstResult = lotteryService.performSnakeDraft(drawing.id!!, user.id!!, seed = 123L)
        val firstExecutionId = firstResult.executionId

        val secondResult = lotteryService.performSnakeDraft(drawing.id!!, user.id!!, seed = 456L)
        val secondExecutionId = secondResult.executionId

        // Publish the second execution
        drawing.publishedExecutionId = secondExecutionId
        drawing.status = DrawingStatus.PUBLISHED
        drawingRepository.save(drawing)

        // Act - Get allocations without specifying executionId (should return published execution)
        val url = "/cabin-lottery/admin/drawings/${drawing.id}/allocations"
        val response = restClient(true)
            .exchange(url, HttpMethod.GET, null, object : ParameterizedTypeReference<List<CabinAllocationDTO>>() {})

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val allocations = response.body!!

        // Verify all allocations are from the published (second) execution
        val allocationExecutions = executionRepository.findAll()
            .filter { exec -> allocations.any { alloc ->
                allocationRepository.findById(alloc.id!!)
                    .map { it.execution.id == exec.id }
                    .orElse(false)
            }}

        assertThat(allocationExecutions).hasSize(1)
        assertThat(allocationExecutions.first().id).isEqualTo(secondExecutionId)
    }

    @Test
    fun `should return allocations from specific execution when executionId is specified`() {
        // Arrange - Create drawing
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

        // Create wishes
        wishRepository.save(
            CabinWish(
                drawing = drawing,
                user = user,
                period = period,
                priority = 1,
                desiredApartments = listOf(apt1, apt2)
            )
        )

        // Perform two draws with different seeds
        val firstResult = lotteryService.performSnakeDraft(drawing.id!!, user.id!!, seed = 123L)
        val firstExecutionId = firstResult.executionId

        val secondResult = lotteryService.performSnakeDraft(drawing.id!!, user.id!!, seed = 456L)
        val secondExecutionId = secondResult.executionId

        // Publish the second execution
        drawing.publishedExecutionId = secondExecutionId
        drawing.status = DrawingStatus.PUBLISHED
        drawingRepository.save(drawing)

        // Act - Get allocations for the FIRST execution specifically
        val url = "/cabin-lottery/admin/drawings/${drawing.id}/allocations?executionId=$firstExecutionId"
        val response = restClient(true)
            .exchange(url, HttpMethod.GET, null, object : ParameterizedTypeReference<List<CabinAllocationDTO>>() {})

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val allocations = response.body!!

        // Verify all allocations are from the first execution (not the published one)
        val allocationExecutions = executionRepository.findAll()
            .filter { exec -> allocations.any { alloc ->
                allocationRepository.findById(alloc.id!!)
                    .map { it.execution.id == exec.id }
                    .orElse(false)
            }}

        assertThat(allocationExecutions).hasSize(1)
        assertThat(allocationExecutions.first().id).isEqualTo(firstExecutionId)
        assertThat(allocationExecutions.first().id).isNotEqualTo(secondExecutionId)
    }

    @Test
    fun `should return allocations from latest execution when drawing is not published and no executionId specified`() {
        // Arrange - Create drawing
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.DRAWN  // Not PUBLISHED
            )
        )

        // Create apartments
        val apt1 = apartmentRepository.save(Apartment(cabin_name = "Hytte 1", sort_order = 1))

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

        // Create wishes
        wishRepository.save(
            CabinWish(
                drawing = drawing,
                user = user,
                period = period,
                priority = 1,
                desiredApartments = listOf(apt1)
            )
        )

        // Perform two draws
        lotteryService.performSnakeDraft(drawing.id!!, user.id!!, seed = 123L)

        // Small delay to ensure different timestamps
        Thread.sleep(100)

        val latestResult = lotteryService.performSnakeDraft(drawing.id!!, user.id!!, seed = 456L)
        val latestExecutionId = latestResult.executionId

        // Act - Get allocations without executionId (should return latest execution)
        val url = "/cabin-lottery/admin/drawings/${drawing.id}/allocations"
        val response = restClient(true)
            .exchange(url, HttpMethod.GET, null, object : ParameterizedTypeReference<List<CabinAllocationDTO>>() {})

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val allocations = response.body!!

        // Verify all allocations are from the latest execution
        val allocationExecutions = executionRepository.findAll()
            .filter { exec -> allocations.any { alloc ->
                allocationRepository.findById(alloc.id!!)
                    .map { it.execution.id == exec.id }
                    .orElse(false)
            }}

        assertThat(allocationExecutions).hasSize(1)
        assertThat(allocationExecutions.first().id).isEqualTo(latestExecutionId)
    }

    @Test
    fun `should return empty list when drawing has no executions`() {
        // Arrange - Create drawing with no executions
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.OPEN
            )
        )

        // Act - Get allocations
        val url = "/cabin-lottery/admin/drawings/${drawing.id}/allocations"
        val response = restClient(true)
            .exchange(url, HttpMethod.GET, null, object : ParameterizedTypeReference<List<CabinAllocationDTO>>() {})

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).isEmpty()
    }
}