package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.entity.Booking
import org.springframework.stereotype.Service

@Service
class BookingMapper {
    fun toBookingDTO(booking: Booking): BookingDTO = BookingDTO(
        id = booking.id,
        start_date = booking.start_date,
        end_date = booking.end_date,
        house_id = booking.house_id,
        employee_id = booking.employee_id?:null,
    )
}
//todo: find out where to use this