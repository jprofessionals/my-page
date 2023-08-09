package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.dto.CreateInformationNoticeDTO
import no.jpro.mypageapi.dto.InformationNoticeDTO
import no.jpro.mypageapi.dto.UpdateInformationNoticeDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.InfoBooking
import no.jpro.mypageapi.repository.InformationNoticeRepository
import no.jpro.mypageapi.utils.mapper.InformationNoticeMapper
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.format.DateTimeFormatter

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
            informationNoticeRepository.findBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate)
        return informationNotices.map { informationNoticeMapper.toInFormationNoticeDTO(it)}
    }

    @PersistenceContext
    private lateinit var entityManager: EntityManager
    fun getOldBookingsWithinDates(wishStartDate: LocalDate, wishEndDate: LocalDate): List<InfoBooking> {
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
    fun filterOverlappingBookings(wishStartDate: LocalDate, wishEndDate: LocalDate): List<InfoBooking> {
        val infoNoticeOverlappingWishedInfoNotice = getOldBookingsWithinDates(wishStartDate, wishEndDate)

        val filteredInfoNotices = infoNoticeOverlappingWishedInfoNotice.filter { infoNotice ->
            ((wishStartDate.isBefore(infoNotice.endDate) && (wishEndDate.isAfter(infoNotice.startDate))) ||
                (wishStartDate.isBefore(infoNotice.endDate) && (wishEndDate.isAfter(infoNotice.endDate))) ||
                (wishStartDate.isAfter(infoNotice.startDate) && (wishEndDate.isBefore(infoNotice.endDate))) ||
                (wishStartDate.isBefore(infoNotice.startDate) && (wishEndDate.isAfter(infoNotice.endDate))))
        }
        return filteredInfoNotices
    }

    fun createBooking(infoNoticeRequest: CreateInformationNoticeDTO): InformationNoticeDTO {
        val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val checkBookingAvailable = filterOverlappingBookings(infoNoticeRequest.startDate, infoNoticeRequest.endDate)

        if(checkBookingAvailable.isEmpty() && infoNoticeRequest.endDate <= LocalDate.parse(cutOffDate, dateFormatter)) {
            val infoNotice = informationNoticeMapper.toInFormationNotice(
                infoNoticeRequest,
            )
            return informationNoticeMapper.toInFormationNoticeDTO(informationNoticeRepository.save(infoNotice))
        } else {
            throw IllegalArgumentException("Ikke mulig å opprette informasjonsnotisen. Eksisterer en annen notis i samme tidsperiode.")
        }
    }

    fun filterOverlappingInfoNoticesExcludingInfoBookingToEdit(wishStartDate: LocalDate, wishEndDate: LocalDate, informationNoticeToExclude: InfoBooking?): List<InfoBooking> {
        val filteredInformationNotices = filterOverlappingBookings(wishStartDate, wishEndDate)
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
}