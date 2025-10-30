package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.PendingBooking
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface PendingBookingRepository : JpaRepository<PendingBooking, Long> {
    fun findPendingBookingsByStartDateBetweenOrEndDateBetween(startDate: LocalDate, endDate: LocalDate, startDate1: LocalDate, endDate2: LocalDate): List<PendingBooking>

    fun findPendingBookingByEmployeeSub(employeeSub: String): List<PendingBooking>

    fun findPendingBookingById(pendingBookingId: Long): PendingBooking?

    @Query("""
        SELECT p from PendingBooking p
        where p.apartment.id = :apartmentId
            AND p.employee.id = :employeeId
            AND ( p.endDate > :startDate AND p.startDate < :endDate OR :startDate < p.endDate AND :endDate > p.startDate)
    """)
    fun findOverlappingPendingBookings(
        employeeId: Long, apartmentId: Long, startDate: LocalDate, endDate: LocalDate
    ): List<PendingBooking>
}