package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.UpdateBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.Setting
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.repository.SettingsRepository
import no.jpro.mypageapi.service.slack.SlackService
import no.jpro.mypageapi.utils.mapper.ApartmentMapper
import no.jpro.mypageapi.utils.mapper.BookingMapper
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
class BookingServiceTest {

    @Mock
    private lateinit var bookingRepository: BookingRepository

    @Mock
    private lateinit var bookingMapper: BookingMapper

    @Mock
    private lateinit var apartmentRepository: ApartmentRepository

    @Mock
    private lateinit var apartmentMapper: ApartmentMapper

    @Mock
    private lateinit var settingsRepository: SettingsRepository

    @Mock
    private lateinit var slackService: SlackService

    private lateinit var bookingService: BookingService

    @BeforeEach
    fun setup() {
        bookingService = BookingService(
            bookingRepository,
            bookingMapper,
            apartmentRepository,
            apartmentMapper,
            settingsRepository,
            slackService,
            null // self-injection not needed for unit tests
        )
    }

    @Nested
    inner class GetCutoffDate {

        @Test
        fun `should return cutoff date from settings`() {
            // Arrange
            val setting = Setting(
                settingId = "CUTOFF_DATE_VACANCIES",
                settingValue = "2025-12-31",
                priority = 1,
                description = "Cutoff date"
            )
            whenever(settingsRepository.findSettingBySettingId("CUTOFF_DATE_VACANCIES")).thenReturn(setting)

            // Act
            val result = bookingService.getCutoffDate()

            // Assert
            assertEquals(LocalDate.of(2025, 12, 31), result)
        }

        @Test
        fun `should throw when cutoff date setting not found`() {
            // Arrange
            whenever(settingsRepository.findSettingBySettingId("CUTOFF_DATE_VACANCIES")).thenReturn(null)

            // Act & Assert
            assertThrows(NullPointerException::class.java) {
                bookingService.getCutoffDate()
            }
        }
    }

    @Nested
    inner class GetBooking {

        @Test
        fun `should return booking by id`() {
            // Arrange
            val apartment = createApartment(1L, "Hovedhytta")
            val booking = createBooking(1L, apartment)
            whenever(bookingRepository.findBookingById(1L)).thenReturn(booking)

            // Act
            val result = bookingService.getBooking(1L)

            // Assert
            assertNotNull(result)
            assertEquals(1L, result?.id)
        }

        @Test
        fun `should return null when booking not found`() {
            // Arrange
            whenever(bookingRepository.findBookingById(any())).thenReturn(null)

            // Act
            val result = bookingService.getBooking(999L)

            // Assert
            assertNull(result)
        }
    }

    @Nested
    inner class GetUserBookings {

        @Test
        fun `should return bookings for user sub`() {
            // Arrange
            val userSub = "user-sub-123"
            val apartment = createApartment(1L, "Hovedhytta")
            val booking = createBooking(1L, apartment)
            val bookingDTO = mock<BookingDTO>()

            whenever(bookingRepository.findBookingsByEmployeeSub(userSub)).thenReturn(listOf(booking))
            whenever(bookingMapper.toBookingDTO(booking)).thenReturn(bookingDTO)

            // Act
            val result = bookingService.getUserBookings(userSub)

            // Assert
            assertEquals(1, result.size)
            verify(bookingRepository).findBookingsByEmployeeSub(userSub)
        }

        @Test
        fun `should return empty list when user has no bookings`() {
            // Arrange
            whenever(bookingRepository.findBookingsByEmployeeSub(any())).thenReturn(emptyList())

            // Act
            val result = bookingService.getUserBookings("user-sub")

            // Assert
            assertTrue(result.isEmpty())
        }
    }

    @Nested
    inner class GetAllApartments {

        @Test
        fun `should return all apartments`() {
            // Arrange
            val apartments = listOf(
                createApartment(1L, "Hovedhytta"),
                createApartment(2L, "Leiligheten")
            )
            whenever(apartmentRepository.findAll()).thenReturn(apartments)
            whenever(apartmentMapper.toApartmentDTO(any())).thenReturn(mock())

            // Act
            val result = bookingService.getAllApartments()

            // Assert
            assertEquals(2, result.size)
        }
    }

    @Nested
    inner class GetApartment {

        @Test
        fun `should return apartment by id`() {
            // Arrange
            val apartment = createApartment(1L, "Hovedhytta")
            whenever(apartmentRepository.existsApartmentById(1L)).thenReturn(true)
            whenever(apartmentRepository.findApartmentById(1L)).thenReturn(apartment)

            // Act
            val result = bookingService.getApartment(1L)

            // Assert
            assertEquals("Hovedhytta", result.cabin_name)
        }

        @Test
        fun `should throw when apartment not found`() {
            // Arrange
            whenever(apartmentRepository.existsApartmentById(999L)).thenReturn(false)

            // Act & Assert
            val exception = assertThrows(IllegalArgumentException::class.java) {
                bookingService.getApartment(999L)
            }
            assertTrue(exception.message!!.contains("Apartment not found"))
        }
    }

    @Nested
    inner class CreateBooking {

        // Note: Tests for createBooking with overlapping checks require EntityManager
        // which is better tested as integration tests. Here we focus on the simpler cases.
    }

    @Nested
    inner class ValidateCutoffAndCreateBooking {

        @Test
        fun `should throw when end date is after cutoff`() {
            // Arrange
            val cutoffSetting = Setting(
                settingId = "CUTOFF_DATE_VACANCIES",
                settingValue = "2025-06-01",
                priority = 1,
                description = "Cutoff"
            )
            val user = createTestUser("test@example.com")
            val createRequest = CreateBookingDTO(
                apartmentID = 1L,
                startDate = LocalDate.of(2025, 5, 25),
                endDate = LocalDate.of(2025, 6, 5) // After cutoff
            )

            whenever(settingsRepository.findSettingBySettingId("CUTOFF_DATE_VACANCIES")).thenReturn(cutoffSetting)

            // Act & Assert
            val exception = assertThrows(IllegalArgumentException::class.java) {
                bookingService.validateCutoffAndCreateBooking(createRequest, user)
            }
            assertTrue(exception.message!!.contains("Sluttdato må være før"))
        }
    }

    @Nested
    inner class DeleteBooking {

        @Test
        fun `should delete booking by id`() {
            // Arrange
            val bookingId = 123L

            // Act
            bookingService.deleteBooking(bookingId)

            // Assert
            verify(bookingRepository).deleteById(bookingId)
        }
    }

    @Nested
    inner class GetAllVacanciesInAPeriod {

        @Test
        fun `should return all dates as vacant when no bookings exist`() {
            // Arrange
            val startDate = LocalDate.of(2025, 6, 1)
            val endDate = LocalDate.of(2025, 6, 3)
            val apartment = createApartment(1L, "Hovedhytta")

            whenever(bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(endDate, startDate))
                .thenReturn(emptyList())
            whenever(apartmentRepository.findAll()).thenReturn(listOf(apartment))

            // Act
            val result = bookingService.getAllVacanciesInAPeriod(startDate, endDate)

            // Assert
            assertEquals(1, result.size)
            assertEquals(3, result[1L]?.size) // 3 days: June 1, 2, 3
        }

        @Test
        fun `should exclude booked dates from vacancies`() {
            // Arrange
            val startDate = LocalDate.of(2025, 6, 1)
            val endDate = LocalDate.of(2025, 6, 5)
            val apartment = createApartment(1L, "Hovedhytta")
            val booking = createBooking(1L, apartment, LocalDate.of(2025, 6, 2), LocalDate.of(2025, 6, 3))

            whenever(bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(endDate, startDate))
                .thenReturn(listOf(booking))
            whenever(apartmentRepository.findAll()).thenReturn(listOf(apartment))

            // Act
            val result = bookingService.getAllVacanciesInAPeriod(startDate, endDate)

            // Assert
            val vacantDates = result[1L]!!
            assertTrue(vacantDates.contains(LocalDate.of(2025, 6, 1)))
            assertFalse(vacantDates.contains(LocalDate.of(2025, 6, 2)))
            assertFalse(vacantDates.contains(LocalDate.of(2025, 6, 3)))
            assertTrue(vacantDates.contains(LocalDate.of(2025, 6, 4)))
            assertTrue(vacantDates.contains(LocalDate.of(2025, 6, 5)))
        }
    }

    // Note: EditBooking tests require EntityManager for overlap checks
    // These are better tested as integration tests.

    private fun createApartment(id: Long, name: String): Apartment {
        return Apartment(id = id, cabin_name = name, sort_order = 1)
    }

    private fun createBooking(
        id: Long,
        apartment: Apartment,
        startDate: LocalDate = LocalDate.of(2025, 6, 1),
        endDate: LocalDate = LocalDate.of(2025, 6, 7)
    ): Booking {
        return Booking(
            id = id,
            startDate = startDate,
            endDate = endDate,
            apartment = apartment
        )
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
}
