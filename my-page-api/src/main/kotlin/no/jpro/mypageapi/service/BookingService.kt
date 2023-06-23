package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.utils.mapper.BookingMapper
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.repository.BookingRepository
import org.springframework.stereotype.Service

@Service
class BookingService (private val bookingRepository: BookingRepository,
    private val bookingMapper: BookingMapper,){
    fun getBooking(bookingId: Long): Booking? {
        return bookingRepository.findBookingById(bookingId)
    }
}
/* todo: this
    fun getBookings(employee_id: Long): List<BookingDTO> {
        val bookings = bookingRepository.findBookingByEmployeeId(employee_id)
        return bookings.map { bookingMapper.toBookingDTO(it)}
 */