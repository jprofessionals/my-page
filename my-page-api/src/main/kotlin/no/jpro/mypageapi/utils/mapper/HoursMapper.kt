package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.HoursDTO
import no.jpro.mypageapi.entity.Hours
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.Hours as HoursModel
import java.math.BigDecimal

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

    fun toHoursModel(hoursDTO: HoursDTO): HoursModel {
        return HoursModel(
            id = hoursDTO.id,
            hours = BigDecimal.valueOf(hoursDTO.hours),
            createdBy = hoursDTO.createdBy,
            dateOfUsage = hoursDTO.dateOfUsage
        )
    }
}