package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.AvailabilityStatus
import no.jpro.mypageapi.entity.ConsultantAvailability
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ConsultantAvailabilityRepository : JpaRepository<ConsultantAvailability, Long> {
    fun findByConsultantId(consultantId: Long): ConsultantAvailability?
    fun findByStatus(status: AvailabilityStatus): List<ConsultantAvailability>
    fun findByStatusIn(statuses: List<AvailabilityStatus>): List<ConsultantAvailability>
}
