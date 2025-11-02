package no.jpro.mypageapi.integration.cabinlottery

import no.jpro.mypageapi.dto.BulkCreateWishesDTO
import no.jpro.mypageapi.dto.CabinWishDTO
import no.jpro.mypageapi.dto.CreateWishDTO
import no.jpro.mypageapi.entity.CabinDrawing
import no.jpro.mypageapi.model.BulkCreateWishes
import no.jpro.mypageapi.model.CabinWish
import no.jpro.mypageapi.model.CreateCabinWish
import no.jpro.mypageapi.entity.CabinPeriod
import no.jpro.mypageapi.entity.DrawingStatus
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.repository.CabinDrawingRepository
import no.jpro.mypageapi.repository.CabinPeriodRepository
import no.jpro.mypageapi.repository.CabinWishRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.time.LocalDate

/**
 * Integration tests for authentication flows in Cabin Lottery API
 * Tests both JWT authentication (production) and X-Test-User-Id header (development/test mode)
 *
 * Note: Inherits @ActiveProfiles("test") from IntegrationTestBase which enables X-Test-User-Id support
 */
@DisplayName("Cabin Lottery Authentication")
class CabinLotteryAuthenticationTest(
    @Autowired private val drawingRepository: CabinDrawingRepository,
    @Autowired private val periodRepository: CabinPeriodRepository,
    @Autowired private val wishRepository: CabinWishRepository,
    @Autowired private val apartmentRepository: no.jpro.mypageapi.repository.ApartmentRepository,
) : IntegrationTestBase() {

    private lateinit var apt1: no.jpro.mypageapi.entity.Apartment
    private lateinit var apt2: no.jpro.mypageapi.entity.Apartment

    @BeforeEach
    fun setup() {
        wishRepository.deleteAll()
        periodRepository.deleteAll()
        drawingRepository.deleteAll()
        apartmentRepository.deleteAll()

        // Create test apartments
        apt1 = apartmentRepository.save(no.jpro.mypageapi.entity.Apartment(cabin_name = "Test Hytte 1", sort_order = 1))
        apt2 = apartmentRepository.save(no.jpro.mypageapi.entity.Apartment(cabin_name = "Test Hytte 2", sort_order = 2))
    }

    @Nested
    @DisplayName("X-Test-User-Id header authentication (development mode)")
    inner class TestUserAuthenticationTests {

        @Test
        fun `should authenticate getMyWishes with X-Test-User-Id header`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.OPEN
                )
            )

            // Act - Call endpoint without Bearer token but with X-Test-User-Id header
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/cabin-lottery/drawings/${drawing.id}/my-wishes",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body).isInstanceOf(List::class.java)
        }

        @Test
        fun `should authenticate submitWishes with X-Test-User-Id header`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.OPEN
                )
            )
            val period = periodRepository.save(
                CabinPeriod(
                    drawing = drawing,
                    startDate = LocalDate.of(2025, 6, 1),
                    endDate = LocalDate.of(2025, 6, 8),
                    description = "Test Period",
                    sortOrder = 1
                )
            )

            val wishDto = BulkCreateWishesDTO(
                wishes = listOf(
                    CreateWishDTO(
                        periodId = period.id!!,
                        priority = 1,
                        desiredApartmentIds = listOf(apt1.id!!, apt2.id!!),
                        comment = "Test wish"
                    )
                )
            )

            // Act - Submit wishes with X-Test-User-Id header
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/cabin-lottery/drawings/${drawing.id}/wishes",
                HttpMethod.POST,
                HttpEntity(wishDto),
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body).hasSize(1)
            assertThat(response.body!![0].priority).isEqualTo(1)
        }

        @Test
        fun `should authenticate getMyAllocations with X-Test-User-Id header`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.DRAWN
                )
            )

            // Act
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/cabin-lottery/drawings/${drawing.id}/my-allocations",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body).isInstanceOf(List::class.java)
        }

        @Test
        fun `should return 401 when neither JWT nor test user header provided`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.OPEN
                )
            )

            // Act - Call without any authentication
            val response = restClient(authenticated = false).exchange(
                "/cabin-lottery/drawings/${drawing.id}/my-wishes",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        }
    }

    @Nested
    @DisplayName("JWT authentication (production mode)")
    inner class JwtAuthenticationTests {

        @Test
        fun `should authenticate getMyWishes with JWT Bearer token`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.OPEN
                )
            )

            // Act - Use standard authenticated client (Bearer token)
            val response = restClient(authenticated = true).exchange(
                "/cabin-lottery/drawings/${drawing.id}/my-wishes",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
        }

        @Test
        fun `should authenticate submitWishes with JWT Bearer token`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.OPEN
                )
            )
            val period = periodRepository.save(
                CabinPeriod(
                    drawing = drawing,
                    startDate = LocalDate.of(2025, 6, 1),
                    endDate = LocalDate.of(2025, 6, 8),
                    description = "Test Period",
                    sortOrder = 1
                )
            )

            val wishDto = BulkCreateWishesDTO(
                wishes = listOf(
                    CreateWishDTO(
                        periodId = period.id!!,
                        priority = 1,
                        desiredApartmentIds = listOf(apt1.id!!, apt2.id!!),
                        comment = null
                    )
                )
            )

            // Act
            val response = restClient(authenticated = true).exchange(
                "/cabin-lottery/drawings/${drawing.id}/wishes",
                HttpMethod.POST,
                HttpEntity(wishDto),
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).hasSize(1)
        }

        @Test
        fun `should authenticate getMyAllocations with JWT Bearer token`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.DRAWN
                )
            )

            // Act
            val response = restClient(authenticated = true).exchange(
                "/cabin-lottery/drawings/${drawing.id}/my-allocations",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
        }
    }

    @Nested
    @DisplayName("Authentication precedence (development mode)")
    inner class AuthenticationPrecedenceTests {

        @Test
        fun `should use test user when X-Test-User-Id header is provided in development mode`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.OPEN
                )
            )
            val period = periodRepository.save(
                CabinPeriod(
                    drawing = drawing,
                    startDate = LocalDate.of(2025, 6, 1),
                    endDate = LocalDate.of(2025, 6, 8),
                    description = "Test Period",
                    sortOrder = 1
                )
            )

            // Create wish for specific user
            val wishDto = BulkCreateWishesDTO(
                wishes = listOf(
                    CreateWishDTO(
                        periodId = period.id!!,
                        priority = 1,
                        desiredApartmentIds = listOf(apt1.id!!, apt2.id!!),
                        comment = "Test wish for user ${user.id}"
                    )
                )
            )

            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val createResponse = client.exchange(
                "/cabin-lottery/drawings/${drawing.id}/wishes",
                HttpMethod.POST,
                HttpEntity(wishDto),
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            assertThat(createResponse.statusCode).isEqualTo(HttpStatus.OK)

            // Act - Fetch wishes for the same user
            val client2 = restClient(authenticated = false)
            client2.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val getResponse = client2.exchange(
                "/cabin-lottery/drawings/${drawing.id}/my-wishes",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            // Assert - Should get back the wish created by this user
            assertThat(getResponse.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(getResponse.body).hasSize(1)
            assertThat(getResponse.body!![0].userId).isEqualTo(user.id)
        }

        @Test
        fun `should use JWT when no X-Test-User-Id header in development mode`() {
            // Arrange
            val drawing = drawingRepository.save(
                CabinDrawing(
                    season = "Test 2025",
                    status = DrawingStatus.OPEN
                )
            )

            // Act - Use JWT authentication (no X-Test-User-Id header)
            val response = restClient(authenticated = true).exchange(
                "/cabin-lottery/drawings/${drawing.id}/my-wishes",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<CabinWishDTO>>() {}
            )

            // Assert - Should succeed with JWT
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        }
    }
}