package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.CreateInformationNoticeDTO
import no.jpro.mypageapi.dto.InformationNoticeDTO
import no.jpro.mypageapi.dto.UpdateInformationNoticeDTO
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

    // OpenAPI model conversions
    fun toOpenApiModel(dto: InformationNoticeDTO): no.jpro.mypageapi.model.InformationNotice =
        no.jpro.mypageapi.model.InformationNotice(
            id = dto.id,
            startDate = dto.startDate,
            endDate = dto.endDate,
            description = dto.description
        )

    fun toDTO(model: no.jpro.mypageapi.model.CreateInformationNotice): CreateInformationNoticeDTO =
        CreateInformationNoticeDTO(
            startDate = model.startDate,
            endDate = model.endDate,
            description = model.description
        )

    fun toDTO(model: no.jpro.mypageapi.model.UpdateInformationNotice): UpdateInformationNoticeDTO =
        UpdateInformationNoticeDTO(
            startDate = model.startDate,
            endDate = model.endDate,
            description = model.description
        )
}