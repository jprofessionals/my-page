package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.SalesStageHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface SalesStageHistoryRepository : JpaRepository<SalesStageHistory, Long> {
    fun findByActivityId(activityId: Long): List<SalesStageHistory>
    fun findByActivityIdOrderByChangedAtDesc(activityId: Long): List<SalesStageHistory>

    @Query("SELECT h FROM SalesStageHistory h WHERE h.activity.consultant.id = :consultantId ORDER BY h.changedAt DESC")
    fun findByConsultantIdOrderByChangedAtDesc(consultantId: Long): List<SalesStageHistory>

    @Query("SELECT h FROM SalesStageHistory h ORDER BY h.changedAt DESC")
    fun findAllOrderByChangedAtDesc(): List<SalesStageHistory>
}
