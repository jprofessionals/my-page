package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.AvailabilityHistory
import no.jpro.mypageapi.entity.AvailabilityStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface AvailabilityHistoryRepository : JpaRepository<AvailabilityHistory, Long> {

    fun findByConsultantIdOrderByChangedAtDesc(consultantId: Long): List<AvailabilityHistory>

    fun findByChangedAtBetweenOrderByChangedAtAsc(
        startDate: LocalDateTime,
        endDate: LocalDateTime
    ): List<AvailabilityHistory>

    fun findByToStatusInAndChangedAtBetween(
        statuses: List<AvailabilityStatus>,
        startDate: LocalDateTime,
        endDate: LocalDateTime
    ): List<AvailabilityHistory>

    @Query("""
        SELECT ah FROM AvailabilityHistory ah
        WHERE ah.consultant.id = :consultantId
        AND ah.changedAt <= :asOfDate
        ORDER BY ah.changedAt DESC
        LIMIT 1
    """)
    fun findLatestStatusAsOf(consultantId: Long, asOfDate: LocalDateTime): AvailabilityHistory?
}
