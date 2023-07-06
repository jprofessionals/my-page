package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.ApartmentDTO
import no.jpro.mypageapi.entity.Apartment
import org.springframework.stereotype.Service

@Service
class ApartmentMapper {
    fun toApartmentDTO(apartment: Apartment): ApartmentDTO = ApartmentDTO(
        id = apartment.id,
        cabin_name = apartment.cabin_name
    )
}