package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.HoursDTO
import no.jpro.mypageapi.entity.Hours
import org.springframework.stereotype.Service

@Service
class HoursMapper {

    fun toHoursDTO(hours: Hours): HoursDTO {
        return HoursDTO(
            id = hours.id,
            hours = hours.hours,
            createdBy = hours.createdBy ?: "",
            dateOfUsage = hours.dateOfUsage
        )
    }
}