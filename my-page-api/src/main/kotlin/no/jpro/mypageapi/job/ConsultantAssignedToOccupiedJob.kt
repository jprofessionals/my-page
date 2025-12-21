package no.jpro.mypageapi.job

import no.jpro.mypageapi.entity.AvailabilityHistory
import no.jpro.mypageapi.entity.AvailabilityStatus
import no.jpro.mypageapi.repository.AvailabilityHistoryRepository
import no.jpro.mypageapi.repository.ConsultantAvailabilityRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Scheduled job that transitions consultants from ASSIGNED to OCCUPIED status
 * when their actual start date is reached.
 *
 * ASSIGNED status means the consultant has won an assignment but hasn't started yet.
 * The availableFrom field stores the actual start date.
 */
@Service
class ConsultantAssignedToOccupiedJob(
    private val consultantAvailabilityRepository: ConsultantAvailabilityRepository,
    private val availabilityHistoryRepository: AvailabilityHistoryRepository
) {
    private val logger = LoggerFactory.getLogger(ConsultantAssignedToOccupiedJob::class.java)

    /**
     * Runs every day at 06:00 to check for ASSIGNED consultants whose start date has arrived
     */
    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    fun transitionAssignedToOccupied() {
        logger.info("Checking for ASSIGNED consultants ready to transition to OCCUPIED...")

        val today = LocalDate.now()
        val assignedConsultants = consultantAvailabilityRepository.findByStatus(AvailabilityStatus.ASSIGNED)

        if (assignedConsultants.isEmpty()) {
            logger.info("No consultants with ASSIGNED status found")
            return
        }

        var transitionedCount = 0

        for (availability in assignedConsultants) {
            val startDate = availability.availableFrom
            // Transition if start date is today or in the past
            if (startDate != null && !startDate.isAfter(today)) {
                val consultantName = availability.consultant.name ?: availability.consultant.email ?: "Unknown"
                logger.info("Transitioning $consultantName from ASSIGNED to OCCUPIED (start date: $startDate)")

                val previousStatus = availability.status
                availability.status = AvailabilityStatus.OCCUPIED
                availability.updatedAt = LocalDateTime.now()
                // Keep availableFrom as-is for reference

                consultantAvailabilityRepository.save(availability)

                // Log the transition in history
                val historyEntry = AvailabilityHistory(
                    consultant = availability.consultant,
                    fromStatus = previousStatus,
                    toStatus = AvailabilityStatus.OCCUPIED,
                    changedAt = LocalDateTime.now(),
                    changedBy = null // System-initiated transition
                )
                availabilityHistoryRepository.save(historyEntry)

                transitionedCount++
            }
        }

        logger.info("Transitioned $transitionedCount consultants from ASSIGNED to OCCUPIED")
    }
}
