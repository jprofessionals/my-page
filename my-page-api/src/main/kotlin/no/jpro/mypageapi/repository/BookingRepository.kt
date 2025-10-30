package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Booking
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface BookingRepository : JpaRepository<Booking, Long> {
    fun findBookingById(bookingId: Long): Booking?
    fun findBookingByEmployeeId(employeeId: Int): List<Booking>

    fun findBookingsByStartDateBetweenOrEndDateBetween(startDate: LocalDate, endDate: LocalDate, startDate1: LocalDate, endDate2: LocalDate): List<Booking>

    fun findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(
        earliestStartDate: LocalDate, latestStartDate: LocalDate
    ): List<Booking>

    fun findBookingsByEmployeeSub(employeeSub: String): List<Booking>
    fun findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<Booking>

    fun findBookingByStartDateAndEndDateAndApartmentId(
        startDate: LocalDate,
        endDate: LocalDate,
        apartmentId: Long
    ): Booking?
}