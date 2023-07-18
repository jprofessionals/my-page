package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.dto.ApartmentDTO
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.UpdateBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
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

    fun deleteBooking(bookingId: Long) {
        return bookingRepository.deleteById(bookingId)
    }

    fun getApartment(apartmentId: Long): Apartment {
        if(!apartmentRepository.existsApartmentById(apartmentId)){
            throw IllegalArgumentException("Apartment not found for ID: $apartmentId")
        }
        return apartmentRepository.findApartmentById(apartmentId)
    }

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    fun getOldBookingsWithinDates(wishStartDate: LocalDate, wishEndDate: LocalDate): List<Booking> {
        val query = entityManager.createQuery(
            "SELECT b FROM Booking b " +
                    "WHERE (:wishStartDate BETWEEN b.startDate AND b.endDate " +
                    "OR :wishEndDate BETWEEN b.startDate AND b.endDate) " +
                    "OR (b.startDate BETWEEN :wishStartDate AND :wishEndDate " +
                    "AND b.endDate BETWEEN :wishStartDate AND :wishEndDate)",
            Booking::class.java
        )
        query.setParameter("wishStartDate", wishStartDate)
        query.setParameter("wishEndDate", wishEndDate)
        return query.resultList
    }

    fun filterOverlappingBookings(apartmentId: Long, wishStartDate: LocalDate, wishEndDate: LocalDate): List<Booking> {
        val bookingsOverlappingWishedBooking = getOldBookingsWithinDates(wishStartDate, wishEndDate)

        val filteredBookings = bookingsOverlappingWishedBooking.filter { booking ->
            booking.apartment?.id == apartmentId &&
                    ((wishStartDate.isBefore(booking.endDate) && (wishEndDate.isAfter(booking.startDate))) ||
                            (wishStartDate.isBefore(booking.endDate) && (wishEndDate.isAfter(booking.endDate))) ||
                            (wishStartDate.isAfter(booking.startDate) && (wishEndDate.isBefore(booking.endDate))) ||
                            (wishStartDate.isBefore(booking.startDate) && (wishEndDate.isAfter(booking.endDate))))
        }
        return filteredBookings
    }

    fun createBooking(bookingRequest: CreateBookingDTO, createdBy: User): BookingDTO {
        val apartment = getApartment(bookingRequest.apartmentID)

        val checkBookingAvailable = filterOverlappingBookings(bookingRequest.apartmentID,bookingRequest.startDate, bookingRequest.endDate)

        if(checkBookingAvailable.isEmpty()) {
            val booking = bookingMapper.toBooking(
                bookingRequest,
                apartment
            ).copy(
                employee = createdBy
            )
            return bookingMapper.toBookingDTO(bookingRepository.save(booking))
        } else {
            throw IllegalArgumentException("Cannot create booking, since there is already a booking in the date range.")
        }
    }

    fun filterOverlappingBookingsExcludingOwnBooking(apartmentId: Long, wishStartDate: LocalDate, wishEndDate: LocalDate, bookingToExclude: Booking?): List<Booking> {
        val filteredBookings = filterOverlappingBookings(apartmentId, wishStartDate, wishEndDate)
        return filteredBookings.filter { it.id != bookingToExclude?.id }
    }

    fun editBooking(editPostRequest: UpdateBookingDTO, bookingToEdit: Booking): BookingDTO {
        val checkIfBookingUpdate = filterOverlappingBookingsExcludingOwnBooking(bookingToEdit.apartment.id, editPostRequest.startDate, editPostRequest.endDate, bookingToEdit)

        if (checkIfBookingUpdate.isEmpty() && (editPostRequest.startDate.isBefore(editPostRequest.endDate))) {
            return bookingMapper.toBookingDTO(
                bookingRepository.save(
                    bookingToEdit.copy(
                        startDate = editPostRequest.startDate,
                        endDate = editPostRequest.endDate
                    )
                )
            )
        } else {
            throw IllegalArgumentException("Cannot change booking to these dates.")
        }
    }
}
