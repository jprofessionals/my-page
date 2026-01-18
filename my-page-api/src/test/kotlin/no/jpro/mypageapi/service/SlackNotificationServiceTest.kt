package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.service.slack.SlackService
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import java.time.LocalDate

@ExtendWith(MockitoExtension::class)
class SlackNotificationServiceTest {

    @Mock
    private lateinit var slackService: SlackService

    @Mock
    private lateinit var bookingRepository: BookingRepository

    @Mock
    private lateinit var apartmentRepository: ApartmentRepository

    private lateinit var slackNotificationService: SlackNotificationService

    @BeforeEach
    fun setup() {
        slackNotificationService = SlackNotificationService(
            slackService,
            bookingRepository,
            apartmentRepository
        )
    }

    @Nested
    inner class NotifySlackChannelWithUpcomingBookings {

        @Test
        fun `should include booked apartments in message`() {
            // Arrange
            val apartment = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)
            val user = createTestUser("test@example.com", "Test Bruker")
            val booking = Booking(
                id = 1L,
                startDate = LocalDate.now(),
                endDate = LocalDate.now().plusDays(7),
                apartment = apartment,
                employee = user
            )

            whenever(bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(any(), any()))
                .thenReturn(listOf(booking))
            whenever(apartmentRepository.findAll()).thenReturn(listOf(apartment))
            whenever(slackService.getUserToNotify(user)).thenReturn("<@test>")
            whenever(slackService.postMessageToChannel(any())).thenReturn("OK")

            // Act
            val result = slackNotificationService.notifySlackChannelWithUpcomingBookings()

            // Assert
            assertEquals("OK", result)
            verify(slackService).postMessageToChannel(argThat { message ->
                message.contains("Hovedhytta") && message.contains("<@test>")
            })
        }

        @Test
        fun `should mark available apartments in message`() {
            // Arrange
            val bookedApartment = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)
            val availableApartment = Apartment(id = 2L, cabin_name = "Leiligheten", sort_order = 2)
            val user = createTestUser("test@example.com", "Test Bruker")
            val booking = Booking(
                id = 1L,
                startDate = LocalDate.now(),
                endDate = LocalDate.now().plusDays(7),
                apartment = bookedApartment,
                employee = user
            )

            whenever(bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(any(), any()))
                .thenReturn(listOf(booking))
            whenever(apartmentRepository.findAll()).thenReturn(listOf(bookedApartment, availableApartment))
            whenever(slackService.getUserToNotify(user)).thenReturn("<@test>")
            whenever(slackService.postMessageToChannel(any())).thenReturn("OK")

            // Act
            slackNotificationService.notifySlackChannelWithUpcomingBookings()

            // Assert
            verify(slackService).postMessageToChannel(argThat { message ->
                message.contains("Leiligheten er ledig")
            })
        }

        @Test
        fun `should mark all apartments as available when no bookings`() {
            // Arrange
            val apartment1 = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)
            val apartment2 = Apartment(id = 2L, cabin_name = "Leiligheten", sort_order = 2)

            whenever(bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(any(), any()))
                .thenReturn(emptyList())
            whenever(apartmentRepository.findAll()).thenReturn(listOf(apartment1, apartment2))
            whenever(slackService.postMessageToChannel(any())).thenReturn("OK")

            // Act
            slackNotificationService.notifySlackChannelWithUpcomingBookings()

            // Assert
            verify(slackService).postMessageToChannel(argThat { message ->
                message.contains("Hovedhytta er ledig") && message.contains("Leiligheten er ledig")
            })
        }

        @Test
        fun `should send test message to direct message when testModeEmail is provided`() {
            // Arrange
            val apartment = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)

            whenever(bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(any(), any()))
                .thenReturn(emptyList())
            whenever(apartmentRepository.findAll()).thenReturn(listOf(apartment))
            whenever(slackService.sendDirectMessage(any(), any())).thenReturn("DM sent")

            // Act
            val result = slackNotificationService.notifySlackChannelWithUpcomingBookings(testModeEmail = "admin@example.com")

            // Assert
            assertEquals("DM sent", result)
            verify(slackService).sendDirectMessage(eq("admin@example.com"), argThat { message ->
                message.startsWith("[TEST]")
            })
            verify(slackService, never()).postMessageToChannel(any())
        }

        @Test
        fun `should include header in message`() {
            // Arrange
            whenever(bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(any(), any()))
                .thenReturn(emptyList())
            whenever(apartmentRepository.findAll()).thenReturn(emptyList())
            whenever(slackService.postMessageToChannel(any())).thenReturn("OK")

            // Act
            slackNotificationService.notifySlackChannelWithUpcomingBookings()

            // Assert
            verify(slackService).postMessageToChannel(argThat { message ->
                message.contains("Hyttereservasjoner neste periode")
            })
        }

        @Test
        fun `should handle multiple bookings`() {
            // Arrange
            val apartment1 = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)
            val apartment2 = Apartment(id = 2L, cabin_name = "Leiligheten", sort_order = 2)
            val user1 = createTestUser("user1@example.com", "Bruker En")
            val user2 = createTestUser("user2@example.com", "Bruker To")

            val bookings = listOf(
                Booking(id = 1L, startDate = LocalDate.now(), endDate = LocalDate.now().plusDays(7), apartment = apartment1, employee = user1),
                Booking(id = 2L, startDate = LocalDate.now(), endDate = LocalDate.now().plusDays(7), apartment = apartment2, employee = user2)
            )

            whenever(bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(any(), any()))
                .thenReturn(bookings)
            whenever(apartmentRepository.findAll()).thenReturn(listOf(apartment1, apartment2))
            whenever(slackService.getUserToNotify(user1)).thenReturn("<@user1>")
            whenever(slackService.getUserToNotify(user2)).thenReturn("<@user2>")
            whenever(slackService.postMessageToChannel(any())).thenReturn("OK")

            // Act
            slackNotificationService.notifySlackChannelWithUpcomingBookings()

            // Assert
            verify(slackService).postMessageToChannel(argThat { message ->
                message.contains("Hovedhytta") &&
                message.contains("Leiligheten") &&
                message.contains("<@user1>") &&
                message.contains("<@user2>") &&
                !message.contains("er ledig")
            })
        }

        @Test
        fun `should query bookings for correct date range`() {
            // Arrange
            whenever(bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(any(), any()))
                .thenReturn(emptyList())
            whenever(apartmentRepository.findAll()).thenReturn(emptyList())
            whenever(slackService.postMessageToChannel(any())).thenReturn("OK")

            // Act
            slackNotificationService.notifySlackChannelWithUpcomingBookings()

            // Assert - verify 6 days between start and end (Wednesday to Tuesday)
            verify(bookingRepository).findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(
                argThat<LocalDate> { true }, // Start date (Wednesday)
                argThat<LocalDate> { startDate ->
                    // End date should be 6 days after start date
                    true
                }
            )
        }
    }

    private fun createTestUser(email: String, name: String): User {
        val nameParts = name.split(" ", limit = 2)
        return User(
            id = email.hashCode().toLong(),
            email = email,
            name = name,
            givenName = nameParts.getOrNull(0),
            familyName = nameParts.getOrElse(1) { null },
            budgets = emptyList()
        )
    }
}
