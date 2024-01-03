package no.jpro.mypageapi.repository

import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface SettingsRepository : JpaRepository<Setting, String> {
    fun findSettingBySettingId(settingId: String): Setting?
}

@Repository
interface UserRepository : JpaRepository<User, String> {
    fun existsUserBySub(userSub: String): Boolean
    fun findUserBySub(sub: String): User?
    fun findUserByEmailAndSubIsNull(email: String): User?
    fun findUserByEmail(email: String): User?
    fun findUserByName(name: String): User?
    fun findUserById(id: Long): User
}

@Repository
interface BudgetTypeRepository : JpaRepository<BudgetType, Long> {
    fun findBudgetTypesByDefault(default: Boolean): List<BudgetType>
}

@Repository
interface BudgetRepository : JpaRepository<Budget, Long> {
    fun findBudgetsByUserSub(userSub: String): List<Budget>
    fun findBudgetsByUserEmployeeNumber(userEmployeeNumber: Int): List<Budget>
    fun findBudgetById(budgetId: Long): Budget
    fun findBudgetsByUserEmailAndBudgetTypeIn(userEmail: String, budgetTypes: List<BudgetType>): List<Budget>
}

@Repository
interface PostRepository : JpaRepository<Post, Long> {
    fun findPostById(postId: Long): Post?
}

@Repository
interface BookingRepository : JpaRepository<Booking, Long> {
    fun findBookingById(bookingId: Long): Booking?
    fun findBookingByEmployeeId(employeeId: Int): List<Booking>
    fun findBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(
        startDate: LocalDate, endDate: LocalDate
    ): List<Booking>

    fun findBookingsByEmployeeSub(employeeSub: String): List<Booking>
    fun findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<Booking>
}

@Repository
interface PendingBookingRepository : JpaRepository<PendingBooking, Long> {
    fun findPendingBookingsByApartmentIdAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
        apartmentId: Long, startDate: LocalDate, endDate: LocalDate
    ): List<PendingBookingDTO>

    fun findPendingBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(
        startDate: LocalDate, endDate: LocalDate
    ): List<PendingBookingDTO>

    fun findPendingBookingByEmployeeSub(employeeSub: String): List<PendingBooking>

    fun findPendingBookingById(pendingBookingId: Long): PendingBooking?
    fun findPendingBookingsByCreatedDateLessThanEqual(cutoffDate: LocalDate): List<PendingBooking>

    fun findPendingBookingsByEmployeeIdAndApartmentIdAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
        employeeId: Long, apartmentId: Long, startDate: LocalDate, endDate: LocalDate
    ): List<PendingBooking>
}

@Repository
interface ApartmentRepository : JpaRepository<Apartment, Long> {
    override fun findAll(): List<Apartment>
    fun findApartmentById(apartmentId: Long): Apartment
    fun existsApartmentById(apartmentId: Long): Boolean
}
@Repository
interface  InformationNoticeRepository : JpaRepository<InfoBooking, Long> {
    fun findInfoBookingById(infoNoticeId: Long): InfoBooking?
    fun findInfoBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<InfoBooking>

    fun findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<InfoBooking>
}
