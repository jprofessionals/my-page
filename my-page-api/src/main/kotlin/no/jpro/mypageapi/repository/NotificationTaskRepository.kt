package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.NotificationTask
import no.jpro.mypageapi.entity.Status
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NotificationTaskRepository : JpaRepository<NotificationTask, Long> {
    fun findByStatus(status: Status): List<NotificationTask>
    fun findByStatusIn(status: List<Status>): List<NotificationTask>
    fun findByJobPostingId(jobPostingId: Long): NotificationTask
}