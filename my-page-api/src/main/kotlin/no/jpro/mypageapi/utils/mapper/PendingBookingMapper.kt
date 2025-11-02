package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.PendingBooking
import org.springframework.stereotype.Service

@Service
class PendingBookingMapper(
    private val apartmentMapper: ApartmentMapper
) {
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

    fun toPendingBookingModel(dto: PendingBookingDTO): no.jpro.mypageapi.model.PendingBookingDTO {
        return no.jpro.mypageapi.model.PendingBookingDTO(
            id = dto.id,
            startDate = dto.startDate,
            endDate = dto.endDate,
            createdDate = dto.createdDate,
            apartment = dto.apartment?.let { apartmentMapper.toApartmentModel(it) },
            employeeName = dto.employeeName
        )
    }

    fun toCreatePendingBookingDTO(createPendingBooking: no.jpro.mypageapi.model.CreatePendingBooking): CreatePendingBookingDTO {
        return CreatePendingBookingDTO(
            apartmentID = createPendingBooking.apartmentID ?: throw IllegalArgumentException("Apartment ID is required"),
            startDate = createPendingBooking.startDate ?: throw IllegalArgumentException("Start date is required"),
            endDate = createPendingBooking.endDate ?: throw IllegalArgumentException("End date is required")
        )
    }
}
