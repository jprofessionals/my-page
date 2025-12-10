package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.ActivityStatus
import no.jpro.mypageapi.entity.SalesActivity
import no.jpro.mypageapi.entity.SalesStage
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface SalesActivityRepository : JpaRepository<SalesActivity, Long> {
    fun findByStatus(status: ActivityStatus): List<SalesActivity>
    fun findByConsultantId(consultantId: Long): List<SalesActivity>
    fun findByConsultantIdAndStatus(consultantId: Long, status: ActivityStatus): List<SalesActivity>
    fun findByCustomerId(customerId: Long): List<SalesActivity>
    fun findByCustomerIdAndStatus(customerId: Long, status: ActivityStatus): List<SalesActivity>
    fun findByCurrentStage(stage: SalesStage): List<SalesActivity>

    @Query("SELECT sa FROM SalesActivity sa WHERE sa.status = :status ORDER BY sa.consultant.name, sa.currentStage")
    fun findByStatusOrderedByConsultant(status: ActivityStatus): List<SalesActivity>

    @Query("SELECT sa FROM SalesActivity sa WHERE sa.consultant.id = :consultantId AND sa.status = 'ACTIVE' AND sa.id != :excludeId")
    fun findOtherActiveByConsultantId(consultantId: Long, excludeId: Long): List<SalesActivity>

    @Query("""
        SELECT sa FROM SalesActivity sa
        WHERE sa.status = 'ACTIVE'
        AND sa.offerDeadline >= :fromTime
        AND sa.offerDeadline < :toTime
        AND sa.deadlineReminderSent = false
    """)
    fun findActivitiesWithUpcomingDeadline(fromTime: LocalDateTime, toTime: LocalDateTime): List<SalesActivity>

    // Analytics queries
    fun countByStatus(status: ActivityStatus): Long

    @Query("SELECT sa FROM SalesActivity sa WHERE sa.status = :status AND sa.closedAt >= :since")
    fun findByStatusAndClosedAtAfter(status: ActivityStatus, since: LocalDateTime): List<SalesActivity>

    @Query("SELECT sa FROM SalesActivity sa WHERE sa.closedReason IS NOT NULL")
    fun findAllWithClosedReason(): List<SalesActivity>
}
