package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.repository.PendingBookingRepository
import no.jpro.mypageapi.service.BookingService
import no.jpro.mypageapi.utils.mapper.BookingMapper
import no.jpro.mypageapi.utils.mapper.PendingBookingMapper
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.*

@Service

class PendingBookingService(
    private val bookingService: BookingService,
    private val pendingBookingRepository: PendingBookingRepository,
    private val pendingBookingMapper: PendingBookingMapper
    ) {

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


    fun createPendingBooking(bookingRequest: CreatePendingBookingDTO, createdBy: User): PendingBookingDTO {
        val apartment = bookingService.getApartment(bookingRequest.apartmentID)
        val checkBookingAvailable = filterOverlappingBookings(bookingRequest.apartmentID,bookingRequest.startDate, bookingRequest.endDate)

        if(checkBookingAvailable.isEmpty()) {
            val pendingBooking = pendingBookingMapper.toPendingBooking(
                bookingRequest,
                apartment
            ).copy(
                employee = createdBy
            )
            return pendingBookingMapper.toPendingBookingDTO(pendingBookingRepository.save(pendingBooking))
        } else {
            throw IllegalArgumentException("Ikke mulig å opprette bookingen.")
        }
    }

    fun getBookingsBetweenDates(startDate: LocalDate, endDate: LocalDate): List<PendingBookingDTO> {
        val pendingBookings =
            pendingBookingRepository.findPendingBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate)
        return pendingBookings.map { pendingBookingMapper.toPendingBookingDTO(it) }
    }

}