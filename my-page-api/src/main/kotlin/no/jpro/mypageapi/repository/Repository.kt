package no.jpro.mypageapi.repository

import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
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
    fun findByEnabled(enabled: Boolean): List<User>
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
    fun findBudgetsByUserEnabled(enabled: Boolean): List<Budget>
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

    fun findBookingsByStartDateBetweenOrEndDateBetween(startDate: LocalDate, endDate: LocalDate, startDate1: LocalDate, endDate2: LocalDate): List<Booking>

    fun findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(
        earliestStartDate: LocalDate, latestStartDate: LocalDate
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

    fun findPendingBookingsByStartDateBetweenOrEndDateBetween(startDate: LocalDate, endDate: LocalDate, startDate1: LocalDate, endDate2: LocalDate): List<PendingBooking>

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
interface InformationNoticeRepository : JpaRepository<InfoBooking, Long> {
    fun findInfoBookingById(infoNoticeId: Long): InfoBooking?
    fun findInfoBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<InfoBooking>

    fun findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(
        date: LocalDate, anotherDate: LocalDate
    ): List<InfoBooking>
}

@Repository
interface CustomerRepository : JpaRepository<Customer, Long> {
    fun findByName(name: String): Customer?
}

@Repository
interface TagRepository : JpaRepository<Tag, Long> {
    fun findByName(name: String): Tag?
}

@Repository
interface JobPostingRepository : JpaRepository<JobPosting, Long> {

    @Query("""
        SELECT jp
        FROM JobPosting jp
        LEFT JOIN jp.tags t
        GROUP BY jp
        HAVING 
            :#{#tagNames == null || #tagNames.isEmpty()} = true
            OR 
            COUNT(CASE WHEN t.name IN :tagNames THEN 1 END) = :#{#tagNames != null ? #tagNames.size() : 0}
    """)
    fun findAllWithFilters(
        @Param("tagNames") tagNames: List<String>?,
    ): List<JobPosting>

}
