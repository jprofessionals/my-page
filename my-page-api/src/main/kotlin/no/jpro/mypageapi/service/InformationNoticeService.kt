package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.dto.CreateInformationNoticeDTO
import no.jpro.mypageapi.dto.InformationNoticeDTO
import no.jpro.mypageapi.dto.UpdateInformationNoticeDTO
import no.jpro.mypageapi.entity.InfoBooking
import no.jpro.mypageapi.repository.InformationNoticeRepository
import no.jpro.mypageapi.utils.mapper.InformationNoticeMapper
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@Service
class InformationNoticeService (
    private val informationNoticeRepository: InformationNoticeRepository,
    private val informationNoticeMapper: InformationNoticeMapper,
){
    fun getInfoNotice(infoNoticeId: Long): InfoBooking? {
        return informationNoticeRepository.findInfoBookingById(infoNoticeId)
    }
    fun getInformationNoticesInPeriod(startDate: LocalDate, endDate: LocalDate): List<InformationNoticeDTO> {
        val informationNotices =
            informationNoticeRepository.findInfoBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate)
        return informationNotices.map { informationNoticeMapper.toInFormationNoticeDTO(it)}
    }

    @PersistenceContext
    private lateinit var entityManager: EntityManager
    fun getOldInfoNoticesWithinDates(wishStartDate: LocalDate, wishEndDate: LocalDate): List<InfoBooking> {
        val query = entityManager.createQuery(
            "SELECT b FROM InfoBooking b " +
                    "WHERE (:wishStartDate BETWEEN b.startDate AND b.endDate " +
                    "OR :wishEndDate BETWEEN b.startDate AND b.endDate) " +
                    "OR (b.startDate BETWEEN :wishStartDate AND :wishEndDate " +
                    "AND b.endDate BETWEEN :wishStartDate AND :wishEndDate)",
            InfoBooking::class.java
        )
        query.setParameter("wishStartDate", wishStartDate)
        query.setParameter("wishEndDate", wishEndDate)
        return query.resultList
    }
    fun filterOverlappingInfoNotices(wishStartDate: LocalDate, wishEndDate: LocalDate): List<InfoBooking> {
        val infoNoticeOverlappingWishedInfoNotice = getOldInfoNoticesWithinDates(wishStartDate, wishEndDate)

        val filteredInfoNotices = infoNoticeOverlappingWishedInfoNotice.filter { infoNotice ->
            ((wishStartDate.isBefore(infoNotice.endDate) && (wishEndDate.isAfter(infoNotice.startDate))) ||
                (wishStartDate.isBefore(infoNotice.endDate) && (wishEndDate.isAfter(infoNotice.endDate))) ||
                (wishStartDate.isAfter(infoNotice.startDate) && (wishEndDate.isBefore(infoNotice.endDate))) ||
                (wishStartDate.isBefore(infoNotice.startDate) && (wishEndDate.isAfter(infoNotice.endDate))))
        }
        return filteredInfoNotices
    }

    fun createInfoNotice(infoNoticeRequest: CreateInformationNoticeDTO): InformationNoticeDTO {
        val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val overlappingInfoNotices = filterOverlappingInfoNotices(infoNoticeRequest.startDate, infoNoticeRequest.endDate)

        if(overlappingInfoNotices.isEmpty() && infoNoticeRequest.endDate <= LocalDate.parse(cutOffDate, dateFormatter)) {
            val infoNotice = informationNoticeMapper.toInFormationNotice(
                infoNoticeRequest,
            )
            return informationNoticeMapper.toInFormationNoticeDTO(informationNoticeRepository.save(infoNotice))
        } else {
            throw IllegalArgumentException("Ikke mulig å opprette informasjonsnotisen. Eksisterer en annen notis i samme tidsperiode.")
        }
    }

    fun filterOverlappingInfoNoticesExcludingInfoBookingToEdit(wishStartDate: LocalDate, wishEndDate: LocalDate, informationNoticeToExclude: InfoBooking?): List<InfoBooking> {
        val filteredInformationNotices = filterOverlappingInfoNotices(wishStartDate, wishEndDate)
        return filteredInformationNotices.filter { it.id != informationNoticeToExclude?.id }
    }

    fun editInformationNotice(editPostRequest: UpdateInformationNoticeDTO, infoNoticeToEdit: InfoBooking): InformationNoticeDTO {
        val overlappingInfoNotices = filterOverlappingInfoNoticesExcludingInfoBookingToEdit(editPostRequest.startDate, editPostRequest.endDate, infoNoticeToEdit)

        if (overlappingInfoNotices.isEmpty() && (editPostRequest.startDate.isBefore(editPostRequest.endDate))) {
            return informationNoticeMapper.toInFormationNoticeDTO(
                informationNoticeRepository.save(
                    infoNoticeToEdit.copy(
                        startDate = editPostRequest.startDate,
                        endDate = editPostRequest.endDate,
                        description = editPostRequest.description
                    )
                )
            )
        } else {
            throw IllegalArgumentException("Kan ikke endre omfanget av notisen til disse datoene.")
        }
    }

    fun deleteInformationNotice(infoNoticeId: Long) {
        return informationNoticeRepository.deleteById(infoNoticeId)
    }

    fun getAllVacanciesInAPeriod(startDate: LocalDate, endDate: LocalDate): List<LocalDate> {
        val datesInRange = LongRange(0, ChronoUnit.DAYS.between(startDate, endDate))
            .map { startDate.plusDays(it) }
        val notices = informationNoticeRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(endDate, startDate)
        val unavailableDays = notices
            .flatMap { infoNotice ->
                LongRange(0, ChronoUnit.DAYS.between(infoNotice.startDate, infoNotice.endDate))
                    .map { infoNotice.startDate.plusDays(it) }
            }.toSet()
        val vacancies = datesInRange.minus(unavailableDays)
        return vacancies.toList()
    }
}