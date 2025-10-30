package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Notification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NotificationRepository : JpaRepository<Notification, Long> {
    fun findByUserIdAndJobPostingId(userId: Long, jobPostingId: Long): Notification?
}