package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.CreateInformationNoticeDTO
import no.jpro.mypageapi.dto.InformationNoticeDTO
import no.jpro.mypageapi.entity.InfoBooking
import org.springframework.stereotype.Service

@Service
class InformationNoticeMapper {
    fun toInFormationNoticeDTO (informationNotice: InfoBooking) : InformationNoticeDTO = InformationNoticeDTO(
        id = informationNotice.id,
        startDate = informationNotice.startDate,
        endDate = informationNotice.endDate,
        description = informationNotice.description
    )
    fun toInFormationNotice(createInformationNoticeDTO: CreateInformationNoticeDTO): InfoBooking = InfoBooking(
        startDate = createInformationNoticeDTO.startDate,
        endDate = createInformationNoticeDTO.endDate,
        description = createInformationNoticeDTO.description,
    )
}