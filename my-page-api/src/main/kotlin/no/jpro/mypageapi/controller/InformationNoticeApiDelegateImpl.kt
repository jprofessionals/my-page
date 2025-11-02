package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.InformationNoticeApiDelegate
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.model.CreateInformationNotice
import no.jpro.mypageapi.model.InformationNotice
import no.jpro.mypageapi.model.UpdateInformationNotice
import no.jpro.mypageapi.service.InformationNoticeService
import no.jpro.mypageapi.utils.mapper.InformationNoticeMapper
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.time.LocalDate
import java.util.*

@Service
class InformationNoticeApiDelegateImpl(
    private val informationNoticeService: InformationNoticeService,
    private val informationNoticeMapper: InformationNoticeMapper,
    private val request: Optional<NativeWebRequest>
) : InformationNoticeApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getInformationNotices(
        startDate: LocalDate,
        endDate: LocalDate
    ): ResponseEntity<List<InformationNotice>> {
        try {
            val informationNotices = informationNoticeService.getInformationNoticesInPeriod(startDate, endDate)
            val models = informationNotices.map { informationNoticeMapper.toOpenApiModel(it) }
            return ResponseEntity.ok(models)
        } catch (e: Exception) {
            throw MyPageRestException(HttpStatus.BAD_REQUEST, e.message)
        }
    }

    @RequiresAdmin
    override fun createInformationNotice(
        createInformationNotice: CreateInformationNotice
    ): ResponseEntity<InformationNotice> {
        try {
            val dto = informationNoticeMapper.toDTO(createInformationNotice)
            val createdNotice = informationNoticeService.createInfoNotice(dto)
            val model = informationNoticeMapper.toOpenApiModel(createdNotice)
            return ResponseEntity.status(HttpStatus.CREATED).body(model)
        } catch (e: IllegalArgumentException) {
            throw MyPageRestException(HttpStatus.BAD_REQUEST, e.message)
        }
    }

    @RequiresAdmin
    override fun updateInformationNotice(
        infoNoticeId: Long,
        updateInformationNotice: UpdateInformationNotice
    ): ResponseEntity<Unit> {
        val infoNoticeToEdit = informationNoticeService.getInfoNotice(infoNoticeId)
            ?: return ResponseEntity.notFound().build()

        try {
            val dto = informationNoticeMapper.toDTO(updateInformationNotice)
            informationNoticeService.editInformationNotice(dto, infoNoticeToEdit)
            return ResponseEntity.ok().build()
        } catch (e: IllegalArgumentException) {
            throw MyPageRestException(HttpStatus.BAD_REQUEST, e.message)
        }
    }

    @RequiresAdmin
    override fun deleteInformationNotice(infoNoticeId: Long): ResponseEntity<Unit> {
        val infoNotice = informationNoticeService.getInfoNotice(infoNoticeId)
            ?: return ResponseEntity.notFound().build()

        informationNoticeService.deleteInformationNotice(infoNoticeId)
        return ResponseEntity.ok().build()
    }

    override fun getInformationNoticeVacancies(
        startdate: LocalDate,
        enddate: LocalDate
    ): ResponseEntity<List<LocalDate>> {
        try {
            val availability = informationNoticeService.getAllVacanciesInAPeriod(startdate, enddate)
            return ResponseEntity.ok(availability)
        } catch (e: Exception) {
            throw MyPageRestException(HttpStatus.BAD_REQUEST, e.message)
        }
    }
}