package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.BookingMapper
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BookingService(
    private val bookingRepository: BookingRepository,
    private val bookingMapper: BookingMapper,
    private val userRepository: UserRepository,
    private val apartmentRepository: ApartmentRepository,
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
        return bookings.map { bookingMapper.toBookingDTO(it)}
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

    fun deleteBooking(bookingId: Long) {
        return bookingRepository.deleteById(bookingId)
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
