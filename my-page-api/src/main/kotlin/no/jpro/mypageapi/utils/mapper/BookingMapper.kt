package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import org.springframework.stereotype.Service

@Service
class BookingMapper {
    fun toBookingDTO(booking: Booking): BookingDTO = BookingDTO(
        id = booking.id,
        startDate = booking.startDate,
        endDate = booking.endDate,
        apartment = booking.apartment,
        employeeName = booking.employee?.name
    )

    fun toBooking(createBookingDTO: CreateBookingDTO, apartment: Apartment): Booking = Booking(
        startDate = createBookingDTO.startDate,
        endDate = createBookingDTO.endDate,
        apartment = apartment,
    )
}
