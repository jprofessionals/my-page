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

@Service

class PendingBookingService(
    private val bookingService: BookingService,
    private val pendingBookingRepository: PendingBookingRepository,
    private val pendingBookingMapper: PendingBookingMapper
    ) {

    fun createPendingBooking(bookingRequest: CreatePendingBookingDTO, createdBy: User): PendingBookingDTO {
        val apartment = bookingService.getApartment(bookingRequest.apartmentID)
        val checkBookingAvailable = bookingService.filterOverlappingBookings(bookingRequest.apartmentID,bookingRequest.startDate, bookingRequest.endDate)

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






}