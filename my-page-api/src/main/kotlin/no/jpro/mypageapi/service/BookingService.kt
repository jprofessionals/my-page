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

    fun checkApartmentAvailability(existingBookingList: List<Booking>, apartmentId: Long?, date: LocalDate): Boolean {
        val apartmentBookings = existingBookingList.filter { booking -> booking.apartment?.id == apartmentId }
            .filter { booking -> booking.startDate <= date && booking.endDate >= date }
        return when {
            apartmentBookings.size >= 2 -> false
            (apartmentBookings.size == 1 && apartmentBookings[0].startDate == date) || (apartmentBookings.size == 1 && apartmentBookings[0].endDate == date) -> true //"Apartment with id $apartmentId is available, can make new booking with this day as end date."
            apartmentBookings.isEmpty() -> true
            else -> false
        }
    }

    fun getAllVacanciesInAPeriod(startDate: LocalDate, endDate: LocalDate): List<HashMap<Long, List<LocalDate>>> {
        val datesInRange = mutableListOf<LocalDate>()
        var currentDate = startDate
        while (!currentDate.isAfter(endDate)) {
            datesInRange.add(currentDate)
            currentDate = currentDate.plusDays(1)
        }

        val apartmentVacancies = mutableListOf<HashMap<Long, List<LocalDate>>>()

        val bookings = bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(endDate, startDate)

        val apartments = getAllApartments()

        for (apartment in apartments) {
            val apartmentId = apartment.id!!
            val vacancies = mutableListOf<LocalDate>()
            for (date in datesInRange) {
                val vacancyExists = checkApartmentAvailability(bookings, apartmentId, date)
                if (vacancyExists) {
                    vacancies.add(date)
                }
            }
            if (vacancies.isNotEmpty()) {
                val apartmentVacancy = hashMapOf(apartmentId to vacancies.toList())
                apartmentVacancies.add(apartmentVacancy)
            }
        }

        return apartmentVacancies
    }


    fun getAllApartments(): List<ApartmentDTO> {
        val apartments = apartmentRepository.findAll()
        return apartments.map { apartmentMapper.toApartmentDTO(it) }
    }

}
