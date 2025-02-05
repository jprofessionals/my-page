package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.OffsetDateTime

@Repository
interface SettingsRepository : JpaRepository<Setting, String> {
    fun findSettingBySettingId(settingId: String): Setting?
}

@Repository
interface SubscriptionRepository : JpaRepository<Subscription, Long> {
    fun findByUserIdOrderByTag(userId: Long?): List<Subscription>
    fun findByUserIdAndTag(userId: Long?, tag: String): Subscription?
    fun findAllByTagIn(tags: List<String>): List<Subscription>
    fun deleteByUserIdAndTag(userId: Long?, tag: String)
}

@Repository
interface NotificationTaskRepository : JpaRepository<NotificationTask, Long> {
    fun findByStatus(status: Status): List<NotificationTask>
    fun findByStatusIn(status: List<Status>): List<NotificationTask>
    fun findByJobPostingId(jobPostingId: Long): NotificationTask
}

@Repository
interface NotificationRepository : JpaRepository<Notification, Long> {
    fun findByUserIdAndJobPostingId(userId: Long, jobPostingId: Long): Notification?
}

@Repository
interface UserRepository : JpaRepository<User, String> {
    fun existsUserBySub(userSub: String): Boolean
    fun findUserBySub(sub: String): User?
    fun findUserByEmailAndSubIsNull(email: String): User?
    fun findUserByEmail(email: String): User?
    fun findUserByName(name: String): User?
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
        JOIN jp.customer c
        LEFT JOIN jp.tags t
        WHERE
            (
                jp.id IN :includeIds
            )
            OR
            (
                (
                    :hidden IS NULL
                    OR
                    jp.hidden = :hidden
                )
                AND
                (
                    :#{#customerNames.isEmpty()} = true
                    OR
                    c.name IN :customerNames
                )
                AND
                (
                    :fromDateTime IS NULL
                    OR
                    jp.urgent = true
                    OR
                    jp.deadline >= :fromDateTime
                )
            )
        GROUP BY jp
        HAVING
            (
                jp.id IN :includeIds
            )
            OR
            (
                :#{#tagNames.isEmpty()} = true
                OR 
                COUNT(CASE WHEN t.name IN :tagNames THEN 1 END) = :#{#tagNames.size()}
            )
    """)
    fun findAllWithFilters(
        @Param("customerNames") customerNames: List<String>,
        @Param("fromDateTime") fromDateTime: OffsetDateTime?,
        @Param("hidden") hidden: Boolean?,
        @Param("includeIds") includeIds: List<String>,
        @Param("tagNames") tagNames: List<String>,
    ): List<JobPosting>
}

