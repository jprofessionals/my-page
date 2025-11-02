package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.UpdateBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.Booking as BookingModel
import no.jpro.mypageapi.model.BookingUpdate
import no.jpro.mypageapi.model.CreateBooking

@Service
class BookingMapper(private val apartmentMapper: ApartmentMapper) {
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

    fun toBookingModel(bookingDTO: BookingDTO): BookingModel = BookingModel(
        id = bookingDTO.id?.toString() ?: "",
        startDate = bookingDTO.startDate,
        endDate = bookingDTO.endDate,
        apartment = bookingDTO.apartment?.let { apartmentMapper.toApartmentModel(it) }
            ?: throw IllegalArgumentException("Apartment is required"),
        employeeName = bookingDTO.employeeName,
        isPending = false
    )

    fun toUpdateBookingDTO(bookingUpdate: BookingUpdate): UpdateBookingDTO = UpdateBookingDTO(
        startDate = bookingUpdate.startDate ?: throw IllegalArgumentException("Start date is required"),
        endDate = bookingUpdate.endDate ?: throw IllegalArgumentException("End date is required"),
        apartmentID = bookingUpdate.apartmentId ?: throw IllegalArgumentException("Apartment ID is required")
    )

    fun toCreateBookingDTO(createBooking: CreateBooking): CreateBookingDTO = CreateBookingDTO(
        apartmentID = createBooking.apartmentID ?: throw IllegalArgumentException("Apartment ID is required"),
        startDate = createBooking.startDate ?: throw IllegalArgumentException("Start date is required"),
        endDate = createBooking.endDate ?: throw IllegalArgumentException("End date is required")
    )
}
