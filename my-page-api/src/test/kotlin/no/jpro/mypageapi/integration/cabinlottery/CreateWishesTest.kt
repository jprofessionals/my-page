package no.jpro.mypageapi.integration.cabinlottery

import no.jpro.mypageapi.dto.BulkCreateWishesDTO
import no.jpro.mypageapi.dto.CabinWishDTO
import no.jpro.mypageapi.dto.CreateWishDTO
import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.time.LocalDate

class CreateWishesTest(
    @Autowired private val drawingRepository: CabinDrawingRepository,
    @Autowired private val periodRepository: CabinPeriodRepository,
    @Autowired private val wishRepository: CabinWishRepository,
    @Autowired private val apartmentRepository: ApartmentRepository,
) : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        wishRepository.deleteAll()
        periodRepository.deleteAll()
        drawingRepository.deleteAll()
        apartmentRepository.deleteAll()
    }

    @Test
    fun `should preserve apartment order when creating wishes`() {
        // Arrange - Create drawing
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.OPEN
            )
        )

        // Create apartments with specific sort_order to verify they're not sorting by that
        val apt1 = apartmentRepository.save(Apartment(cabin_name = "Hytte 1", sort_order = 1))
        val apt2 = apartmentRepository.save(Apartment(cabin_name = "Hytte 2", sort_order = 2))
        val apt3 = apartmentRepository.save(Apartment(cabin_name = "Hytte 3", sort_order = 3))

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

        // Act - Create wish with specific apartment order: 3, 1, 2
        // This order is DIFFERENT from both ID order and sort_order
        val desiredApartmentIds = listOf(apt3.id!!, apt1.id!!, apt2.id!!)

        val wishDto = BulkCreateWishesDTO(
            wishes = listOf(
                CreateWishDTO(
                    periodId = period.id!!,
                    priority = 1,
                    desiredApartmentIds = desiredApartmentIds,
                    comment = "Test comment"
                )
            )
        )

        val url = "/cabin-lottery/drawings/${drawing.id}/wishes"
        val response = restClient(true)
            .exchange(
                url,
                HttpMethod.POST,
                HttpEntity(wishDto),
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val wishes = response.body!!
        assertThat(wishes).hasSize(1)

        val wish = wishes.first()

        // CRITICAL: The order should match the input order, not ID order or sort_order
        // Expected: [apt3.id, apt1.id, apt2.id] (3, 1, 2)
        // Bug would return: [apt1.id, apt2.id, apt3.id] (1, 2, 3) sorted by sort_order or ID
        assertThat(wish.desiredApartmentIds).containsExactly(apt3.id!!, apt1.id!!, apt2.id!!)

        // Verify names are also in correct order
        assertThat(wish.desiredApartmentNames).containsExactly("Hytte 3", "Hytte 1", "Hytte 2")
    }

    @Test
    fun `should preserve apartment order across multiple wishes`() {
        // Arrange - Create drawing
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.OPEN
            )
        )

        // Create apartments
        val apt1 = apartmentRepository.save(Apartment(cabin_name = "Hytte 1", sort_order = 1))
        val apt2 = apartmentRepository.save(Apartment(cabin_name = "Hytte 2", sort_order = 2))
        val apt3 = apartmentRepository.save(Apartment(cabin_name = "Hytte 3", sort_order = 3))

        // Create periods
        val period1 = periodRepository.save(
            CabinPeriod(
                drawing = drawing,
                startDate = LocalDate.of(2025, 6, 1),
                endDate = LocalDate.of(2025, 6, 8),
                description = "Uke 23",
                sortOrder = 1
            )
        )

        val period2 = periodRepository.save(
            CabinPeriod(
                drawing = drawing,
                startDate = LocalDate.of(2025, 6, 8),
                endDate = LocalDate.of(2025, 6, 15),
                description = "Uke 24",
                sortOrder = 2
            )
        )

        // Act - Create two wishes with different apartment orders
        val wishDto = BulkCreateWishesDTO(
            wishes = listOf(
                CreateWishDTO(
                    periodId = period1.id!!,
                    priority = 1,
                    desiredApartmentIds = listOf(apt2.id!!, apt3.id!!, apt1.id!!), // Order: 2, 3, 1
                    comment = "First wish"
                ),
                CreateWishDTO(
                    periodId = period2.id!!,
                    priority = 2,
                    desiredApartmentIds = listOf(apt3.id!!, apt1.id!!), // Order: 3, 1
                    comment = "Second wish"
                )
            )
        )

        val url = "/cabin-lottery/drawings/${drawing.id}/wishes"
        val response = restClient(true)
            .exchange(
                url,
                HttpMethod.POST,
                HttpEntity(wishDto),
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val wishes = response.body!!
        assertThat(wishes).hasSize(2)

        // First wish should have order: 2, 3, 1
        val firstWish = wishes.first { it.priority == 1 }
        assertThat(firstWish.desiredApartmentIds).containsExactly(apt2.id!!, apt3.id!!, apt1.id!!)
        assertThat(firstWish.desiredApartmentNames).containsExactly("Hytte 2", "Hytte 3", "Hytte 1")

        // Second wish should have order: 3, 1
        val secondWish = wishes.first { it.priority == 2 }
        assertThat(secondWish.desiredApartmentIds).containsExactly(apt3.id!!, apt1.id!!)
        assertThat(secondWish.desiredApartmentNames).containsExactly("Hytte 3", "Hytte 1")
    }

    @Test
    fun `should preserve apartment order when retrieving existing wishes`() {
        // Arrange - Create drawing
        val drawing = drawingRepository.save(
            CabinDrawing(
                season = "Test 2025",
                status = DrawingStatus.OPEN
            )
        )

        // Create apartments
        val apt1 = apartmentRepository.save(Apartment(cabin_name = "Hytte 1", sort_order = 1))
        val apt2 = apartmentRepository.save(Apartment(cabin_name = "Hytte 2", sort_order = 2))
        val apt3 = apartmentRepository.save(Apartment(cabin_name = "Hytte 3", sort_order = 3))

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

        // Create wish with specific order: 3, 1, 2
        val wishDto = BulkCreateWishesDTO(
            wishes = listOf(
                CreateWishDTO(
                    periodId = period.id!!,
                    priority = 1,
                    desiredApartmentIds = listOf(apt3.id!!, apt1.id!!, apt2.id!!),
                    comment = "Test"
                )
            )
        )

        val createUrl = "/cabin-lottery/drawings/${drawing.id}/wishes"
        restClient(true).exchange(
            createUrl,
            HttpMethod.POST,
            HttpEntity(wishDto),
            object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
        )

        // Act - Retrieve the wishes
        val getUrl = "/cabin-lottery/drawings/${drawing.id}/my-wishes"
        val response = restClient(true)
            .exchange(
                getUrl,
                HttpMethod.GET,
                null,
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

        // Assert
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        val wishes = response.body!!
        assertThat(wishes).hasSize(1)

        val wish = wishes.first()

        // Order should still be preserved: 3, 1, 2
        assertThat(wish.desiredApartmentIds).containsExactly(apt3.id!!, apt1.id!!, apt2.id!!)
        assertThat(wish.desiredApartmentNames).containsExactly("Hytte 3", "Hytte 1", "Hytte 2")
    }
}
