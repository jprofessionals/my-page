package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.utils.mapper.BookingMapper
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.repository.BookingRepository
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BookingService (private val bookingRepository: BookingRepository,
    private val bookingMapper: BookingMapper,){
    fun getBooking(bookingId: Long): Booking? {
        return bookingRepository.findBookingById(bookingId)
    }
    fun getBookings(employeeId: Int): List<BookingDTO> {
        val bookings = bookingRepository.findBookingByEmployeeId(employeeId)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getBookingsPerMonth(startDate: LocalDate, endDate: LocalDate): List<BookingDTO>{
        val bookings = bookingRepository.findBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate)
        return bookings.map {bookingMapper.toBookingDTO(it) }
    }
}
