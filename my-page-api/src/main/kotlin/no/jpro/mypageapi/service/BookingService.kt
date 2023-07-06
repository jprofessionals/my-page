package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.ApartmentDTO
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.utils.mapper.ApartmentMapper
import no.jpro.mypageapi.utils.mapper.BookingMapper
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BookingService(
    private val bookingRepository: BookingRepository,
    private val bookingMapper: BookingMapper,
    private val apartmentRepository: ApartmentRepository,
    private val apartmentMapper: ApartmentMapper,
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

    fun getAvailableBookingsOnDay(date: LocalDate, apartmentId: Long): String {
        val bookings =
            bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(date, date)
        return checkApartmentAvailability(bookings, apartmentId, date)
    }
    fun checkApartmentAvailability(existingBookingList: List<Booking>, apartmentId: Long, date: LocalDate): String {
        val apartmentBookings = existingBookingList.filter { booking -> booking.apartment?.id == apartmentId }
        //val dates = //lag en liste med alle datoene i et år
       // val availableDates =
            //Lag en liste med alle ledige datoer, if ledig -> legg inn i listen
        return when {
            apartmentBookings.size >= 2 -> "Apartment with id $apartmentId exists in existingBookings, cannot make new booking."
            apartmentBookings.size == 1 && apartmentBookings[0].startDate == date -> "Apartment with id $apartmentId is available, can make new booking with this day as end date."
            apartmentBookings.size == 1 && apartmentBookings[0].endDate == date -> "Apartment with id $apartmentId is available, can make new booking with this day as start date."
            apartmentBookings.isEmpty() -> "No reservations on this day. Apartment with id $apartmentId is available"
            else -> "Apartment with id $apartmentId exists in existingBookings, cannot make new booking."
        }
    }
    fun getAllApartments(): List<ApartmentDTO>{
        val apartments = apartmentRepository.findAll()
        return apartments.map{apartmentMapper.toApartmentDTO(it)}
    }

}
