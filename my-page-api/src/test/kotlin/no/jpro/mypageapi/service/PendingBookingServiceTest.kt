package no.jpro.mypageapi.service

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.PendingBookingRepository
import no.jpro.mypageapi.service.PendingBookingService.Companion.INCLUDES_WEDNESDAY_ERROR_MESSAGE
import no.jpro.mypageapi.service.PendingBookingService.Companion.TOO_LONG_ERROR_MESSAGE
import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*
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
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@ExtendWith(MockitoExtension::class)
@Import(MockApplicationConfig::class)
class PendingBookingServiceTest @Autowired constructor(private val pendingBookingService: PendingBookingService) {

    @Autowired
    private lateinit var pendingBookingRepository: PendingBookingRepository

    @MockitoBean
    lateinit var bookingService: BookingService

    @MockitoBean
    lateinit var jwtDecoder: JwtDecoder //Used by Spring Boot at application startup

    @MockitoBean
    lateinit var credentialsProvider: CredentialsProvider //Used by Spring Boot at application startup

    @MockitoBean
    lateinit var gcpProjectIdProvider: GcpProjectIdProvider //Used by Spring Boot at application startup

    @Test
    fun shouldDeclineLongBookings() {
        val request = CreatePendingBookingDTO(
            1,
            LocalDate.of(2025, 1, 1),
            LocalDate.of(2025, 1, 9),
        )
        val user = User(
            id = 1L,
            email = null,
            name = null,
            givenName = null,
            familyName = null,
            budgets = emptyList(),
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
        val user = User(
            id = 1L,
            email = null,
            name = null,
            givenName = null,
            familyName = null,
            budgets = emptyList(),
        )

        val exception = assertThrows<IllegalArgumentException> {
            pendingBookingService.createPendingBooking(request, user, false)
        }
        assertEquals(INCLUDES_WEDNESDAY_ERROR_MESSAGE, exception.message)
    }
}
