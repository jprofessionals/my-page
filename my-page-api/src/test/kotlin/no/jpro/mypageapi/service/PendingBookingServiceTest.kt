package no.jpro.mypageapi.service

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.PendingBookingRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.PendingBookingService.Companion.ALREADY_HAS_PENDING_BOOKING_MESSAGE_TEMPLATE
import no.jpro.mypageapi.service.PendingBookingService.Companion.INCLUDES_WEDNESDAY_ERROR_MESSAGE
import no.jpro.mypageapi.service.PendingBookingService.Companion.TOO_LONG_ERROR_MESSAGE
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
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
class PendingBookingServiceTest @Autowired constructor(private val pendingBookingService: PendingBookingService) {

    @MockitoBean
    lateinit var jwtDecoder: JwtDecoder //Used by Spring Boot at application startup

    @MockitoBean
    lateinit var credentialsProvider: CredentialsProvider //Used by Spring Boot at application startup

    @MockitoBean
    lateinit var gcpProjectIdProvider: GcpProjectIdProvider //Used by Spring Boot at application startup


    private val user = User(
        id = null,
        email = null,
        name = "Test User",
        givenName = null,
        familyName = null,
        budgets = emptyList(),
    )

    private val apartment = Apartment(
        id = null,
        cabin_name = "Test apartment",
    )

    @Autowired
    private lateinit var pendingBookingRepository: PendingBookingRepository

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var apartmentRepository: ApartmentRepository

    @BeforeEach
    fun setup() {
        userRepository.save(user)
        apartmentRepository.save(apartment)
    }

    @AfterEach
    fun teardown() {
        userRepository.delete(user)
        apartmentRepository.delete(apartment)
    }

    @Test
    fun shouldDeclineLongBookings() {
        val request = CreatePendingBookingDTO(
            1,
            LocalDate.of(2025, 1, 1),
            LocalDate.of(2025, 1, 9),
        )

        val exception = assertThrows<IllegalArgumentException> {
            pendingBookingService.createPendingBooking(request, user, false)
        }
        assertEquals(TOO_LONG_ERROR_MESSAGE, exception.message)
    }

    @Test
    fun shouldDeclineBookingsIncludingWednesdayInMiddle() {
        val request = CreatePendingBookingDTO(
            1,
            LocalDate.of(2025, 1, 7),
            LocalDate.of(2025, 1, 9),
        )

        val exception = assertThrows<IllegalArgumentException> {
            pendingBookingService.createPendingBooking(request, user, false)
        }
        assertEquals(INCLUDES_WEDNESDAY_ERROR_MESSAGE, exception.message)
    }

    @Test
    fun shouldAllowBookingWednesdayToWednesday() {
        val startDate = LocalDate.of(2025, 1, 8)
        val endDate = LocalDate.of(2025, 1, 15)
        val request = CreatePendingBookingDTO(
            apartment.id!!,
            startDate,
            endDate,
        )
        val existingNonOverlappingBooking1 = PendingBooking(
            id = null,
            startDate = startDate.minusDays(1),
            endDate = startDate,
            apartment = apartment,
            employee = user,
        )
        pendingBookingRepository.save(existingNonOverlappingBooking1)
        val existingNonOverlappingBooking2 = PendingBooking(
            id = null,
            startDate = endDate,
            endDate = endDate.plusDays(1),
            apartment = apartment,
            employee = user,
        )
        pendingBookingRepository.save(existingNonOverlappingBooking2)

        try {
            val pendingBookingDTO = pendingBookingService.createPendingBooking(request, user, false)
            assertNotNull(pendingBookingDTO.id)
            assertEquals(apartment, pendingBookingDTO.apartment)
            assertEquals(LocalDate.now(), pendingBookingDTO.createdDate)
            assertEquals(user.name, pendingBookingDTO.employeeName)
            assertEquals(request.startDate, pendingBookingDTO.startDate)
            assertEquals(request.endDate, pendingBookingDTO.endDate)

        } finally {
            pendingBookingRepository.delete(existingNonOverlappingBooking1)
            pendingBookingRepository.delete(existingNonOverlappingBooking2)
        }
    }

    @Test
    fun shouldDeclineOverlappingBookings() {
        val startDate = LocalDate.of(2025, 1, 8)
        val endDate = LocalDate.of(2025, 1, 15)
        val request = CreatePendingBookingDTO(
            apartment.id!!,
            startDate,
            endDate,
        )
        val existingOverlappingBooking = PendingBooking(
            id = null,
            startDate = startDate.minusDays(3),
            endDate = endDate.minusDays(3),
            apartment = apartment,
            employee = user,
        )
        pendingBookingRepository.save(existingOverlappingBooking)

        try {
            val exception = assertThrows<IllegalArgumentException> {
                pendingBookingService.createPendingBooking(request, user, false)
            }
            assertEquals(String.format(ALREADY_HAS_PENDING_BOOKING_MESSAGE_TEMPLATE, user.name), exception.message)
        } finally {
            pendingBookingRepository.delete(existingOverlappingBooking)
        }
    }
}
