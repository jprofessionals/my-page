package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.ApartmentDTO
import no.jpro.mypageapi.entity.Apartment
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.Apartment as ApartmentModel

@Service
class ApartmentMapper {
    fun toApartmentDTO(apartment: Apartment): ApartmentDTO = ApartmentDTO(
        id = apartment.id,
        cabin_name = apartment.cabin_name
    )

    fun toApartmentModel(apartmentDTO: ApartmentDTO): ApartmentModel = ApartmentModel(
        id = apartmentDTO.id ?: 0,
        cabinName = apartmentDTO.cabin_name ?: "",
        sortOrder = null
    )

    fun toApartmentModel(apartment: Apartment): ApartmentModel = ApartmentModel(
        id = apartment.id ?: 0,
        cabinName = apartment.cabin_name ?: "",
        sortOrder = apartment.sort_order
    )
}