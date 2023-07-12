package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.ApartmentDTO
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.ApartmentMapper
import no.jpro.mypageapi.utils.mapper.BookingMapper
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class BookingService(
    private val bookingRepository: BookingRepository,
    private val bookingMapper: BookingMapper,
    private val apartmentRepository: ApartmentRepository,
    private val apartmentMapper: ApartmentMapper,
    private val userRepository: UserRepository,
) {

    fun getBooking(bookingId: Long): Booking? {
        return bookingRepository.findBookingById(bookingId)
    }

    fun getBookings(employeeId: Int): List<BookingDTO> {
        val bookings = bookingRepository.findBookingByEmployeeId(employeeId)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getUserBookings(userSub: String): List<BookingDTO> {
        val bookings = bookingRepository.findBookingsByEmployeeSub(userSub)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getBookingsBetweenDates(startDate: LocalDate, endDate: LocalDate): List<BookingDTO> {
        val bookings =
            bookingRepository.findBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getBookingsOnDay(date: LocalDate): List<BookingDTO> {
        val bookings =
            bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(date, date)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getAllVacanciesInAPeriod(startDate: LocalDate, endDate: LocalDate): Map<Long, List<LocalDate>> {
        val datesInRange = LongRange(0, ChronoUnit.DAYS.between(startDate, endDate))
            .map { startDate.plusDays(it) }
        val bookings = bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(endDate, startDate)
        val bookedDays = bookings
            .flatMap { booking ->
                LongRange(0, ChronoUnit.DAYS.between(booking.startDate, booking.endDate))
                    .map { Pair(booking.apartment!!.id!!, booking.startDate.plusDays(it)) }
            }.groupBy { it.first }
            .mapValues { it.value.map { it.second }.toSet() }
        val apartmentVacancies = apartmentRepository.findAll()
            .map { it.id!! }
            .associateWith { apartmentId -> datesInRange.minus(bookedDays[apartmentId].orEmpty()) }

        return apartmentVacancies
    }

    fun getAllApartments(): List<ApartmentDTO> {
        val apartments = apartmentRepository.findAll()
        return apartments.map { apartmentMapper.toApartmentDTO(it) }
    }

    fun createBooking(apartmentId: Long, startDate: LocalDate, endDate: LocalDate, employeeName: String?): Booking {
        val employee = if (employeeName != null) {
            userRepository.findUserByName(employeeName)
        } else {
            null
        }

        val apartment = apartmentRepository.findById(apartmentId).orElseThrow {
            throw IllegalArgumentException("Apartment not found for ID: $apartmentId")
        }

        val booking = Booking(
            startDate = startDate,
            endDate = endDate,
            apartment = apartment,
            employee = employee
        )

        return bookingRepository.save(booking)
    }

}
