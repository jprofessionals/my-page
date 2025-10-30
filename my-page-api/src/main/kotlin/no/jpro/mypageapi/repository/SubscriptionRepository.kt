package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Subscription
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SubscriptionRepository : JpaRepository<Subscription, Long> {
    fun findByUserIdOrderByTag(userId: Long?): List<Subscription>
    fun findByUserIdAndTag(userId: Long?, tag: String): Subscription?
    fun findAllByTagIn(tags: List<String>): List<Subscription>
    fun deleteByUserIdAndTag(userId: Long?, tag: String)
}