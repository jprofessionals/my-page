package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.InfoBooking
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface InformationNoticeRepository : JpaRepository<InfoBooking, Long> {
    fun findInfoBookingById(infoNoticeId: Long): InfoBooking?
    fun findInfoBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<InfoBooking>

    fun findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<InfoBooking>
}