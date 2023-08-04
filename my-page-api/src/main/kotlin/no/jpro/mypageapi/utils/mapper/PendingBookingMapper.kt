package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.PendingBooking
import org.springframework.stereotype.Service

@Service
class PendingBookingMapper {
    fun toPendingBookingDTO(pendingBooking: PendingBooking): PendingBookingDTO = PendingBookingDTO(
        id = pendingBooking.id,
        startDate = pendingBooking.startDate,
        endDate = pendingBooking.endDate,
        apartment = pendingBooking.apartment,
        employeeName = pendingBooking.employee?.name,
        createdDate = pendingBooking.createdDate
    )

    fun toPendingBooking(createPendingBookingDTO: CreatePendingBookingDTO, apartment: Apartment): PendingBooking = PendingBooking(
        startDate = createPendingBookingDTO.startDate,
        endDate = createPendingBookingDTO.endDate,
        apartment = apartment,
    )
}