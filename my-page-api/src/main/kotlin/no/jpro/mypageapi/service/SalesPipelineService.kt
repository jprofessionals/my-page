package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.ActivityStatus
import no.jpro.mypageapi.entity.AvailabilityHistory
import no.jpro.mypageapi.entity.AvailabilityStatus
import no.jpro.mypageapi.entity.ClosedReason
import no.jpro.mypageapi.entity.ConsultantAvailability
import no.jpro.mypageapi.entity.CustomerSector
import no.jpro.mypageapi.entity.InterviewRound
import no.jpro.mypageapi.entity.SalesActivity
import no.jpro.mypageapi.entity.SalesStage
import no.jpro.mypageapi.entity.SalesStageHistory
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.AvailabilityHistoryRepository
import no.jpro.mypageapi.repository.ConsultantAvailabilityRepository
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.InterviewRoundRepository
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.SalesActivityRepository
import no.jpro.mypageapi.repository.SalesStageHistoryRepository
import no.jpro.mypageapi.repository.SettingsRepository
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.time.ZoneOffset
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

@Service
class SalesPipelineService(
    private val consultantAvailabilityRepository: ConsultantAvailabilityRepository,
    private val availabilityHistoryRepository: AvailabilityHistoryRepository,
    private val salesActivityRepository: SalesActivityRepository,
    private val salesStageHistoryRepository: SalesStageHistoryRepository,
    private val interviewRoundRepository: InterviewRoundRepository,
    private val jobPostingRepository: JobPostingRepository,
    private val settingsRepository: SettingsRepository,
    private val userRepository: UserRepository,
    private val customerRepository: CustomerRepository
) {

    // ==================== Consultant Availability ====================

    @Transactional(readOnly = true)
    fun getAllConsultantAvailability(): List<ConsultantAvailability> =
        consultantAvailabilityRepository.findAll()

    @Transactional(readOnly = true)
    fun getConsultantAvailability(consultantId: Long): ConsultantAvailability? =
        consultantAvailabilityRepository.findByConsultantId(consultantId)

    @Transactional
    fun updateConsultantAvailability(
        consultantId: Long,
        status: AvailabilityStatus,
        availableFrom: LocalDate?,
        currentCustomerId: Long?,
        notes: String?,
        updatedBy: User
    ): ConsultantAvailability {
        val consultant = userRepository.findById(consultantId)
            .orElseThrow { IllegalArgumentException("Consultant not found: $consultantId") }

        val currentCustomer = currentCustomerId?.let {
            customerRepository.findById(it)
                .orElseThrow { IllegalArgumentException("Customer not found: $it") }
        }

        val existing = consultantAvailabilityRepository.findByConsultantId(consultantId)
        val previousStatus = existing?.status

        val availability = existing?.apply {
            this.status = status
            this.availableFrom = availableFrom
            this.currentCustomer = currentCustomer
            this.notes = notes
            this.updatedAt = LocalDateTime.now()
            this.updatedBy = updatedBy
        } ?: ConsultantAvailability(
            consultant = consultant,
            status = status,
            availableFrom = availableFrom,
            currentCustomer = currentCustomer,
            notes = notes,
            updatedBy = updatedBy
        )

        // Log history if status changed
        if (previousStatus != status) {
            val historyEntry = AvailabilityHistory(
                consultant = consultant,
                fromStatus = previousStatus,
                toStatus = status,
                changedAt = LocalDateTime.now(),
                changedBy = updatedBy
            )
            availabilityHistoryRepository.save(historyEntry)
        }

        // If status changed to AVAILABLE, move consultant to bottom of AVAILABLE consultants
        if (status == AvailabilityStatus.AVAILABLE && previousStatus != AvailabilityStatus.AVAILABLE) {
            val allAvailabilities = consultantAvailabilityRepository.findAllByOrderByDisplayOrderAsc()
            val availableConsultants = allAvailabilities.filter {
                it.status == AvailabilityStatus.AVAILABLE && it.consultant.id != consultantId
            }

            // Set display order to be after the last AVAILABLE consultant (or 0 if none)
            val lastAvailableOrder = availableConsultants.maxOfOrNull { it.displayOrder } ?: -1
            availability.displayOrder = lastAvailableOrder + 1

            // Shift all non-AVAILABLE consultants down
            allAvailabilities
                .filter { it.status != AvailabilityStatus.AVAILABLE && it.consultant.id != consultantId }
                .forEachIndexed { index, other ->
                    other.displayOrder = availability.displayOrder + index + 1
                    consultantAvailabilityRepository.save(other)
                }
        }

        return consultantAvailabilityRepository.save(availability)
    }

    @Transactional
    fun reorderConsultants(consultantIds: List<Long>) {
        consultantIds.forEachIndexed { index, consultantId ->
            val availability = consultantAvailabilityRepository.findByConsultantId(consultantId)
            if (availability != null) {
                availability.displayOrder = index
                consultantAvailabilityRepository.save(availability)
            }
        }
    }

    /**
     * Add a consultant to the board without a sales activity.
     * Creates a ConsultantAvailability record if one doesn't exist.
     * @return the created or existing ConsultantAvailability
     * @throws IllegalStateException if consultant is already on the board
     */
    @Transactional
    fun addConsultantToBoard(
        consultantId: Long?,
        flowcaseEmail: String?,
        flowcaseName: String?,
        status: AvailabilityStatus?,
        notes: String?,
        addedBy: User
    ): ConsultantAvailability {
        // Resolve consultant: either by ID or by Flowcase email
        val consultant = when {
            consultantId != null -> {
                userRepository.findById(consultantId)
                    .orElseThrow { IllegalArgumentException("Consultant not found: $consultantId") }
            }
            !flowcaseEmail.isNullOrBlank() -> {
                // Find or create user by email
                userRepository.findUserByEmail(flowcaseEmail) ?: run {
                    // Create a minimal user record for the Flowcase consultant
                    val displayName = flowcaseName ?: flowcaseEmail.substringBefore("@")
                    val nameParts = displayName.split(" ", limit = 2)
                    val newUser = User(
                        email = flowcaseEmail,
                        name = displayName,
                        givenName = nameParts.getOrNull(0),
                        familyName = nameParts.getOrNull(1),
                        sub = "flowcase:$flowcaseEmail", // Unique identifier for Flowcase users
                        budgets = emptyList()
                    )
                    userRepository.save(newUser)
                }
            }
            else -> throw IllegalArgumentException("Either consultantId or flowcaseEmail must be provided")
        }

        // Check if consultant is already on the board
        val existingAvailability = consultantAvailabilityRepository.findByConsultantId(consultant.id!!)
        if (existingAvailability != null) {
            throw IllegalStateException("Consultant is already on the board")
        }

        // Get the next display order (at the end of the list)
        val maxDisplayOrder = consultantAvailabilityRepository.findAllByOrderByDisplayOrderAsc()
            .maxOfOrNull { it.displayOrder } ?: -1

        val initialStatus = status ?: AvailabilityStatus.AVAILABLE
        val availability = ConsultantAvailability(
            consultant = consultant,
            status = initialStatus,
            notes = notes,
            displayOrder = maxDisplayOrder + 1,
            updatedBy = addedBy
        )

        val savedAvailability = consultantAvailabilityRepository.save(availability)

        // Log initial status in history
        val historyEntry = AvailabilityHistory(
            consultant = consultant,
            fromStatus = null,
            toStatus = initialStatus,
            changedAt = LocalDateTime.now(),
            changedBy = addedBy
        )
        availabilityHistoryRepository.save(historyEntry)

        return savedAvailability
    }

    // ==================== Sales Activities ====================

    @Transactional(readOnly = true)
    fun getAllSalesActivities(status: ActivityStatus?): List<SalesActivity> =
        if (status != null) {
            salesActivityRepository.findByStatus(status)
        } else {
            salesActivityRepository.findAll()
        }

    @Transactional(readOnly = true)
    fun getSalesActivitiesByConsultant(consultantId: Long, status: ActivityStatus?): List<SalesActivity> =
        if (status != null) {
            salesActivityRepository.findByConsultantIdAndStatus(consultantId, status)
        } else {
            salesActivityRepository.findByConsultantId(consultantId)
        }

    @Transactional(readOnly = true)
    fun getSalesActivitiesByCustomer(customerId: Long, status: ActivityStatus?): List<SalesActivity> =
        if (status != null) {
            salesActivityRepository.findByCustomerIdAndStatus(customerId, status)
        } else {
            salesActivityRepository.findByCustomerId(customerId)
        }

    @Transactional(readOnly = true)
    fun getSalesActivity(id: Long): SalesActivity? =
        salesActivityRepository.findById(id).orElse(null)

    @Transactional
    fun createSalesActivity(
        consultantId: Long?,
        flowcaseEmail: String?,
        flowcaseName: String?,
        customerId: Long?,
        customerName: String?,
        supplierName: String?,
        title: String,
        stage: SalesStage,
        notes: String?,
        maxPrice: Int?,
        offeredPrice: Int?,
        expectedStartDate: LocalDate?,
        offerDeadline: LocalDateTime?,
        offerDeadlineAsap: Boolean?,
        interviewDate: LocalDateTime?,
        createdBy: User,
        jobPostingId: Long? = null
    ): SalesActivity {
        // Resolve consultant: either by ID or by Flowcase email
        val consultant = when {
            consultantId != null -> {
                userRepository.findById(consultantId)
                    .orElseThrow { IllegalArgumentException("Consultant not found: $consultantId") }
            }
            !flowcaseEmail.isNullOrBlank() -> {
                // Find or create user by email
                userRepository.findUserByEmail(flowcaseEmail) ?: run {
                    // Create a minimal user record for the Flowcase consultant
                    val displayName = flowcaseName ?: flowcaseEmail.substringBefore("@")
                    val nameParts = displayName.split(" ", limit = 2)
                    val newUser = User(
                        email = flowcaseEmail,
                        name = displayName,
                        givenName = nameParts.getOrNull(0),
                        familyName = nameParts.getOrNull(1),
                        sub = "flowcase:$flowcaseEmail", // Unique identifier for Flowcase users
                        budgets = emptyList()
                    )
                    userRepository.save(newUser)
                }
            }
            else -> throw IllegalArgumentException("Either consultantId or flowcaseEmail must be provided")
        }

        val customer = customerId?.let {
            customerRepository.findById(it)
                .orElseThrow { IllegalArgumentException("Customer not found: $it") }
        }

        val activity = SalesActivity(
            consultant = consultant,
            customer = customer,
            customerName = customerName,
            supplierName = supplierName,
            title = title,
            currentStage = stage,
            notes = notes,
            maxPrice = maxPrice,
            offeredPrice = offeredPrice,
            expectedStartDate = expectedStartDate,
            offerDeadline = offerDeadline,
            offerDeadlineAsap = offerDeadlineAsap ?: false,
            interviewDate = interviewDate,
            createdBy = createdBy
        )

        jobPostingId?.let { jpId ->
            activity.jobPosting = jobPostingRepository.findById(jpId).orElse(null)
        }

        val saved = salesActivityRepository.save(activity)

        // Create initial stage history entry
        val historyEntry = SalesStageHistory(
            activity = saved,
            fromStage = null,
            toStage = stage,
            changedBy = createdBy
        )
        saved.stageHistory.add(historyEntry)

        return salesActivityRepository.save(saved)
    }

    @Transactional
    fun updateSalesActivity(
        id: Long,
        customerId: Long?,
        customerName: String?,
        supplierName: String?,
        title: String?,
        notes: String?,
        maxPrice: Int?,
        offeredPrice: Int?,
        expectedStartDate: LocalDate?,
        offerDeadline: LocalDateTime?,
        offerDeadlineAsap: Boolean?,
        interviewDate: LocalDateTime?,
        updatedBy: User
    ): SalesActivity {
        val activity = salesActivityRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Activity not found: $id") }

        if (activity.status != ActivityStatus.ACTIVE) {
            throw IllegalStateException("Cannot update closed activity")
        }

        customerId?.let {
            activity.customer = customerRepository.findById(it)
                .orElseThrow { IllegalArgumentException("Customer not found: $it") }
        }

        // Allow clearing customerName/supplierName by setting it directly (not using let)
        activity.customerName = customerName
        activity.supplierName = supplierName

        title?.let { activity.title = it }
        notes?.let { activity.notes = it }
        maxPrice?.let { activity.maxPrice = it }
        offeredPrice?.let { activity.offeredPrice = it }
        expectedStartDate?.let { activity.expectedStartDate = it }
        // Allow clearing offerDeadline by setting it directly
        activity.offerDeadline = offerDeadline
        offerDeadlineAsap?.let { activity.offerDeadlineAsap = it }
        // Allow clearing interviewDate by setting it directly
        activity.interviewDate = interviewDate
        activity.updatedAt = LocalDateTime.now()

        return salesActivityRepository.save(activity)
    }

    @Transactional
    fun updateSalesActivityStage(
        id: Long,
        newStage: SalesStage,
        changedBy: User
    ): SalesActivity {
        val activity = salesActivityRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Activity not found: $id") }

        if (activity.status != ActivityStatus.ACTIVE) {
            throw IllegalStateException("Cannot update stage of closed activity")
        }

        val oldStage = activity.currentStage
        if (oldStage == newStage) {
            return activity // No change needed
        }

        // Calculate days in previous stage
        val lastHistoryEntry = activity.stageHistory
            .filter { it.toStage == oldStage }
            .maxByOrNull { it.changedAt }

        val daysInPreviousStage = lastHistoryEntry?.let {
            ChronoUnit.DAYS.between(it.changedAt, LocalDateTime.now()).toInt()
        }

        // Create history entry
        val historyEntry = SalesStageHistory(
            activity = activity,
            fromStage = oldStage,
            toStage = newStage,
            changedBy = changedBy,
            daysInPreviousStage = daysInPreviousStage
        )
        activity.stageHistory.add(historyEntry)

        activity.currentStage = newStage
        activity.updatedAt = LocalDateTime.now()

        return salesActivityRepository.save(activity)
    }

    @Transactional
    fun markActivityWon(
        id: Long,
        changedBy: User,
        actualStartDate: LocalDate? = null,
        matchRating: Int? = null,
        evaluationNotes: String? = null,
        evaluationDocumentUrl: String? = null,
        keyFactors: String? = null
    ): SalesActivity {
        val activity = salesActivityRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Activity not found: $id") }

        if (activity.status != ActivityStatus.ACTIVE) {
            throw IllegalStateException("Activity is already closed")
        }

        // Close this activity as WON
        activity.status = ActivityStatus.WON
        activity.closedAt = LocalDateTime.now()
        activity.updatedAt = LocalDateTime.now()
        activity.actualStartDate = actualStartDate
        activity.matchRating = matchRating
        activity.evaluationNotes = evaluationNotes
        activity.evaluationDocumentUrl = evaluationDocumentUrl
        activity.keyFactors = keyFactors

        val savedActivity = salesActivityRepository.save(activity)

        // Close all other active activities for this consultant
        val otherActivities = salesActivityRepository.findOtherActiveByConsultantId(
            activity.consultant.id!!,
            activity.id
        )

        otherActivities.forEach { otherActivity ->
            otherActivity.status = ActivityStatus.CLOSED_OTHER_WON
            otherActivity.closedReason = ClosedReason.CONSULTANT_WON_OTHER
            otherActivity.closedReasonNote = "Konsulenten vant aktivitet: ${activity.title}"
            otherActivity.closedAt = LocalDateTime.now()
            otherActivity.updatedAt = LocalDateTime.now()
            salesActivityRepository.save(otherActivity)
        }

        // Update consultant availability based on actualStartDate
        val availability = consultantAvailabilityRepository.findByConsultantId(activity.consultant.id!!)
        if (availability != null && availability.status != AvailabilityStatus.OCCUPIED) {
            val previousStatus = availability.status
            val today = LocalDate.now()

            // Determine new status: ASSIGNED if start date is in the future, OCCUPIED if today or past
            val newStatus = if (actualStartDate != null && actualStartDate.isAfter(today)) {
                AvailabilityStatus.ASSIGNED
            } else {
                AvailabilityStatus.OCCUPIED
            }

            availability.status = newStatus
            availability.currentCustomer = activity.customer
            availability.availableFrom = actualStartDate // Store the start date for scheduled job
            availability.updatedAt = LocalDateTime.now()
            availability.updatedBy = changedBy
            consultantAvailabilityRepository.save(availability)

            // Log history for the status change
            val historyEntry = AvailabilityHistory(
                consultant = activity.consultant,
                fromStatus = previousStatus,
                toStatus = newStatus,
                changedAt = LocalDateTime.now(),
                changedBy = changedBy
            )
            availabilityHistoryRepository.save(historyEntry)
        }

        return savedActivity
    }

    @Transactional
    fun closeActivity(
        id: Long,
        reason: ClosedReason,
        reasonNote: String?,
        closedBy: User,
        matchRating: Int? = null,
        evaluationNotes: String? = null,
        evaluationDocumentUrl: String? = null,
        keyFactors: String? = null
    ): SalesActivity {
        val activity = salesActivityRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Activity not found: $id") }

        if (activity.status != ActivityStatus.ACTIVE) {
            throw IllegalStateException("Activity is already closed")
        }

        activity.status = ActivityStatus.CLOSED_OTHER_WON // Using this as general closed state
        activity.closedReason = reason
        activity.closedReasonNote = reasonNote
        activity.matchRating = matchRating
        activity.evaluationNotes = evaluationNotes
        activity.evaluationDocumentUrl = evaluationDocumentUrl
        activity.keyFactors = keyFactors
        activity.closedAt = LocalDateTime.now()
        activity.updatedAt = LocalDateTime.now()

        return salesActivityRepository.save(activity)
    }

    @Transactional
    fun deleteActivity(id: Long) {
        val activity = salesActivityRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Activity not found: $id") }

        salesActivityRepository.delete(activity)
    }

    // ==================== Interview Rounds ====================

    @Transactional(readOnly = true)
    fun getInterviewRounds(activityId: Long): List<InterviewRound> =
        interviewRoundRepository.findByActivityIdOrderByRoundNumber(activityId)

    @Transactional
    fun addInterviewRound(
        activityId: Long,
        interviewDate: LocalDateTime?,
        notes: String?
    ): InterviewRound {
        val activity = salesActivityRepository.findById(activityId)
            .orElseThrow { IllegalArgumentException("Activity not found: $activityId") }

        val nextRoundNumber = interviewRoundRepository.countByActivityId(activityId) + 1

        val round = InterviewRound(
            activity = activity,
            roundNumber = nextRoundNumber,
            interviewDate = interviewDate,
            notes = notes
        )

        return interviewRoundRepository.save(round)
    }

    @Transactional
    fun updateInterviewRound(
        roundId: Long,
        interviewDate: LocalDateTime?,
        notes: String?
    ): InterviewRound {
        val round = interviewRoundRepository.findById(roundId)
            .orElseThrow { IllegalArgumentException("Interview round not found: $roundId") }

        round.interviewDate = interviewDate
        round.notes = notes

        return interviewRoundRepository.save(round)
    }

    @Transactional
    fun deleteInterviewRound(roundId: Long) {
        val round = interviewRoundRepository.findById(roundId)
            .orElseThrow { IllegalArgumentException("Interview round not found: $roundId") }

        val activityId = round.activity.id
        interviewRoundRepository.delete(round)

        // Re-number remaining rounds
        val remainingRounds = interviewRoundRepository.findByActivityIdOrderByRoundNumber(activityId)
        remainingRounds.forEachIndexed { index, r ->
            r.roundNumber = index + 1
        }
        interviewRoundRepository.saveAll(remainingRounds)
    }

    /**
     * Remove a consultant from the sales pipeline board.
     * Only removes their availability status - all activities are preserved for analytics.
     * @return true if consultant was on the board, false if not
     */
    @Transactional
    fun removeConsultantFromPipeline(consultantId: Long): Boolean {
        // Check if consultant exists
        val consultantExists = userRepository.existsById(consultantId)
        if (!consultantExists) {
            throw IllegalArgumentException("Consultant not found: $consultantId")
        }

        // Only remove availability info - preserve ALL activities for analytics
        val availability = consultantAvailabilityRepository.findByConsultantId(consultantId)
        if (availability != null) {
            consultantAvailabilityRepository.delete(availability)
            return true
        }

        return false
    }

    // ==================== Pipeline Board ====================

    @Transactional(readOnly = true)
    fun getActivitiesByStatus(): Map<ActivityStatus, List<SalesActivity>> {
        val allActivities = salesActivityRepository.findByStatusOrderedByConsultant(ActivityStatus.ACTIVE)
        return allActivities.groupBy { it.status }
    }

    @Transactional(readOnly = true)
    fun getActivitiesByStage(): Map<SalesStage, List<SalesActivity>> {
        val activeActivities = salesActivityRepository.findByStatus(ActivityStatus.ACTIVE)
        return activeActivities.groupBy { it.currentStage }
    }

    // ==================== Analytics ====================

    data class AnalyticsData(
        val totalActiveActivities: Long,
        // Current period
        val wonThisMonth: Int,
        val wonThisQuarter: Int,
        val wonThisYear: Int,
        val lostThisMonth: Int,
        val lostThisQuarter: Int,
        val lostThisYear: Int,
        val createdThisMonth: Int,
        val createdThisQuarter: Int,
        val createdThisYear: Int,
        // Previous period (for comparison)
        val wonLastMonth: Int,
        val wonLastQuarter: Int,
        val wonLastYear: Int,
        val lostLastMonth: Int,
        val lostLastQuarter: Int,
        val lostLastYear: Int,
        val createdLastMonth: Int,
        val createdLastQuarter: Int,
        val createdLastYear: Int,
        // Other metrics
        val conversionRate: Double,
        val averageDaysToClose: Double,
        val activitiesByStage: Map<SalesStage, Int>,
        val consultantStats: List<ConsultantStats>,
        val customerStats: List<CustomerStats>,
        val closedReasonStats: Map<ClosedReason, Int>,
        val availabilityStats: AvailabilityStatsData,
        val funnelData: List<FunnelStageData>,
        val funnelTotalJobPostings: Int,
        val funnelTotalCreated: Int,
        val funnelWonCount: Int,
        val funnelLostCount: Int
    )

    data class ConsultantStats(
        val consultant: User,
        val activeActivities: Int,
        val wonTotal: Int,
        val lostTotal: Int
    )

    data class CustomerStats(
        val customerName: String,
        val activeActivities: Int,
        val wonTotal: Int,
        val lostTotal: Int
    )

    data class AvailabilityStatsData(
        val totalConsultants: Int,
        val available: Int,
        val availableSoon: Int,
        val assigned: Int,
        val occupied: Int
    )

    data class FunnelStageData(
        val stage: String,
        val reached: Int,  // How many activities have reached this stage
        val current: Int   // How many are currently at this stage
    )

    @Transactional(readOnly = true)
    fun getAnalytics(funnelMonths: Int? = null): AnalyticsData {
        val now = LocalDateTime.now()

        // Current period boundaries
        val startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0)
        val startOfQuarter = now.withMonth(((now.monthValue - 1) / 3) * 3 + 1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0)
        val startOfYear = now.withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0)

        // Previous period boundaries
        val startOfLastMonth = startOfMonth.minusMonths(1)
        val endOfLastMonth = startOfMonth
        val startOfLastQuarter = startOfQuarter.minusMonths(3)
        val endOfLastQuarter = startOfQuarter
        val startOfLastYear = startOfYear.minusYears(1)
        val endOfLastYear = startOfYear

        // Active activities count
        val totalActiveActivities = salesActivityRepository.countByStatus(ActivityStatus.ACTIVE)

        // Won activities - current period
        val wonThisMonth = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.WON, startOfMonth).size
        val wonThisQuarter = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.WON, startOfQuarter).size
        val wonThisYear = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.WON, startOfYear).size

        // Won activities - previous period
        val wonLastMonth = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.WON, startOfLastMonth, endOfLastMonth).size
        val wonLastQuarter = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.WON, startOfLastQuarter, endOfLastQuarter).size
        val wonLastYear = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.WON, startOfLastYear, endOfLastYear).size

        // Lost activities - current period (CLOSED_OTHER_WON is used for closed/lost)
        val lostThisMonth = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.CLOSED_OTHER_WON, startOfMonth).size
        val lostThisQuarter = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.CLOSED_OTHER_WON, startOfQuarter).size
        val lostThisYear = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.CLOSED_OTHER_WON, startOfYear).size

        // Lost activities - previous period
        val lostLastMonth = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.CLOSED_OTHER_WON, startOfLastMonth, endOfLastMonth).size
        val lostLastQuarter = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.CLOSED_OTHER_WON, startOfLastQuarter, endOfLastQuarter).size
        val lostLastYear = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.CLOSED_OTHER_WON, startOfLastYear, endOfLastYear).size

        // Created activities - current period
        val createdThisMonth = salesActivityRepository.findCreatedSince(startOfMonth).size
        val createdThisQuarter = salesActivityRepository.findCreatedSince(startOfQuarter).size
        val createdThisYear = salesActivityRepository.findCreatedSince(startOfYear).size

        // Created activities - previous period
        val createdLastMonth = salesActivityRepository.findCreatedBetween(startOfLastMonth, endOfLastMonth).size
        val createdLastQuarter = salesActivityRepository.findCreatedBetween(startOfLastQuarter, endOfLastQuarter).size
        val createdLastYear = salesActivityRepository.findCreatedBetween(startOfLastYear, endOfLastYear).size

        // Conversion rate (won / (won + lost) for this year)
        val wonYearTotal = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.WON, startOfYear).size
        val lostYearTotal = salesActivityRepository.findByStatusAndClosedAtAfter(ActivityStatus.CLOSED_OTHER_WON, startOfYear).size
        val conversionRate = if (wonYearTotal + lostYearTotal > 0) {
            (wonYearTotal.toDouble() / (wonYearTotal + lostYearTotal)) * 100
        } else 0.0

        // Average days to close
        val allClosedActivities = salesActivityRepository.findAll()
            .filter { it.closedAt != null }
        val averageDaysToClose = if (allClosedActivities.isNotEmpty()) {
            allClosedActivities.mapNotNull { activity ->
                activity.closedAt?.let { closedAt ->
                    ChronoUnit.DAYS.between(activity.createdAt, closedAt).toDouble()
                }
            }.average()
        } else 0.0

        // Activities by stage (funnel)
        val activeActivities = salesActivityRepository.findByStatus(ActivityStatus.ACTIVE)
        val activitiesByStage = SalesStage.entries.associateWith { stage ->
            activeActivities.count { it.currentStage == stage }
        }

        // Consultant stats
        val allActivities = salesActivityRepository.findAll()
        val consultantStats = allActivities.groupBy { it.consultant }
            .map { (consultant, activities) ->
                ConsultantStats(
                    consultant = consultant,
                    activeActivities = activities.count { it.status == ActivityStatus.ACTIVE },
                    wonTotal = activities.count { it.status == ActivityStatus.WON },
                    lostTotal = activities.count { it.status == ActivityStatus.CLOSED_OTHER_WON }
                )
            }
            .sortedByDescending { it.activeActivities + it.wonTotal }

        // Customer stats
        val customerStats = allActivities.groupBy { activity ->
            activity.customer?.name ?: activity.customerName ?: "Ukjent"
        }.map { (customerName, activities) ->
            CustomerStats(
                customerName = customerName,
                activeActivities = activities.count { it.status == ActivityStatus.ACTIVE },
                wonTotal = activities.count { it.status == ActivityStatus.WON },
                lostTotal = activities.count { it.status == ActivityStatus.CLOSED_OTHER_WON }
            )
        }.sortedByDescending { it.activeActivities + it.wonTotal }

        // Closed reason stats
        val activitiesWithReason = salesActivityRepository.findAllWithClosedReason()
        val closedReasonStats = ClosedReason.entries.associateWith { reason ->
            activitiesWithReason.count { it.closedReason == reason }
        }

        // Availability stats - read total consultants from settings (configurable in admin)
        val totalConsultants = settingsRepository.findSettingBySettingId("totalConsultants")
            ?.settingValue?.toIntOrNull() ?: 63
        val availabilities = consultantAvailabilityRepository.findAll()
        val available = availabilities.count { it.status == AvailabilityStatus.AVAILABLE }
        val availableSoon = availabilities.count { it.status == AvailabilityStatus.AVAILABLE_SOON }
        val assigned = availabilities.count { it.status == AvailabilityStatus.ASSIGNED }
        // Occupied = total minus those actually available
        // "availableSoon" and "assigned" are still occupied - just on the sales board or waiting to start
        val occupied = totalConsultants - available
        val availabilityStats = AvailabilityStatsData(
            totalConsultants = totalConsultants,
            available = available,
            availableSoon = availableSoon,
            assigned = assigned,
            occupied = occupied.coerceAtLeast(0) // Ensure non-negative
        )

        // Funnel data - count how many activities have REACHED each stage (not just current)
        // Filter by time period if funnelMonths is specified
        val funnelCutoff = funnelMonths?.let {
            now.minusMonths(it.toLong()).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0)
        }

        // Count job postings (utlysninger) in the funnel period
        val funnelTotalJobPostings = if (funnelCutoff != null) {
            val cutoffOffset = funnelCutoff.atOffset(ZoneOffset.UTC)
            jobPostingRepository.countByCreatedDateAfter(cutoffOffset).toInt()
        } else {
            jobPostingRepository.count().toInt()
        }

        // Get activities within the funnel time period
        val funnelActivities = if (funnelCutoff != null) {
            salesActivityRepository.findCreatedSince(funnelCutoff)
        } else {
            salesActivityRepository.findAll()
        }
        val funnelActivityIds = funnelActivities.map { it.id }.toSet()

        // Get stage history for activities in the funnel period
        val allStageHistory = salesStageHistoryRepository.findAll()
            .filter { funnelActivityIds.contains(it.activity.id) }
        val stagesReachedByActivity = allStageHistory.groupBy { it.activity.id }
            .mapValues { (_, histories) -> histories.map { it.toStage }.toSet() }

        val funnelStages = listOf(
            SalesStage.INTERESTED,
            SalesStage.SENT_TO_SUPPLIER,
            SalesStage.SENT_TO_CUSTOMER,
            SalesStage.INTERVIEW
        )

        // Count won and lost in the funnel period
        val funnelWonCount = funnelActivities.count { it.status == ActivityStatus.WON }
        val funnelLostCount = funnelActivities.count { it.status == ActivityStatus.CLOSED_OTHER_WON }

        val funnelData = funnelStages.map { stage ->
            FunnelStageData(
                stage = stage.name,
                reached = stagesReachedByActivity.count { (_, stages) -> stages.contains(stage) },
                current = funnelActivities.count { it.status == ActivityStatus.ACTIVE && it.currentStage == stage }
            )
        }

        return AnalyticsData(
            totalActiveActivities = totalActiveActivities,
            wonThisMonth = wonThisMonth,
            wonThisQuarter = wonThisQuarter,
            wonThisYear = wonThisYear,
            lostThisMonth = lostThisMonth,
            lostThisQuarter = lostThisQuarter,
            lostThisYear = lostThisYear,
            createdThisMonth = createdThisMonth,
            createdThisQuarter = createdThisQuarter,
            createdThisYear = createdThisYear,
            wonLastMonth = wonLastMonth,
            wonLastQuarter = wonLastQuarter,
            wonLastYear = wonLastYear,
            lostLastMonth = lostLastMonth,
            lostLastQuarter = lostLastQuarter,
            lostLastYear = lostLastYear,
            createdLastMonth = createdLastMonth,
            createdLastQuarter = createdLastQuarter,
            createdLastYear = createdLastYear,
            conversionRate = conversionRate,
            averageDaysToClose = averageDaysToClose,
            activitiesByStage = activitiesByStage,
            consultantStats = consultantStats,
            customerStats = customerStats,
            closedReasonStats = closedReasonStats,
            availabilityStats = availabilityStats,
            funnelData = funnelData,
            funnelTotalJobPostings = funnelTotalJobPostings,
            funnelTotalCreated = funnelActivities.size,
            funnelWonCount = funnelWonCount,
            funnelLostCount = funnelLostCount
        )
    }

    // ==================== Monthly Trends ====================

    data class MonthlyTrendData(
        val month: String,      // Format: "2024-11"
        val created: Int,       // Sales activities created (job postings we responded to)
        val won: Int,           // Activities won
        val lost: Int,          // Activities lost
        val benchWeeks: Double  // Total bench time in work weeks
    )

    @Transactional(readOnly = true)
    fun getMonthlyTrends(months: Int = 12): List<MonthlyTrendData> {
        val now = LocalDateTime.now()
        val startDate = now.minusMonths(months.toLong()).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0)

        // Fetch all activities created since startDate
        val allCreatedActivities = salesActivityRepository.findCreatedSince(startDate)

        // Fetch won and lost activities
        val wonActivities = salesActivityRepository.findClosedByStatusSince(ActivityStatus.WON, startDate)
        val lostActivities = salesActivityRepository.findClosedByStatusSince(ActivityStatus.CLOSED_OTHER_WON, startDate)

        // Fetch all availability history for bench calculation
        val allHistoryEntries = availabilityHistoryRepository.findByChangedAtBetweenOrderByChangedAtAsc(startDate, now)

        // Get all consultants who have availability records (on the board)
        val allAvailabilities = consultantAvailabilityRepository.findAll()
        val consultantsOnBoard = allAvailabilities.map { it.consultant.id!! }.toSet()

        // Build a map of when each consultant became available (from availableFrom field or history)
        val availableFromByConsultant = allAvailabilities.associate { availability ->
            val consultantId = availability.consultant.id!!
            // Use availableFrom if set, otherwise fall back to first history entry
            val availableFromDate = availability.availableFrom?.atStartOfDay()
                ?: availabilityHistoryRepository.findFirstByConsultantIdOrderByChangedAtAsc(consultantId)?.changedAt
            consultantId to availableFromDate
        }.filterValues { it != null }.mapValues { it.value!! }

        // Build result for each month
        val result = mutableListOf<MonthlyTrendData>()

        for (i in 0 until months) {
            val monthStart = now.minusMonths((months - 1 - i).toLong()).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0)
            val monthEnd = monthStart.plusMonths(1)
            val monthStr = "${monthStart.year}-${monthStart.monthValue.toString().padStart(2, '0')}"

            // Count created activities for this month
            val createdCount = allCreatedActivities.count { activity ->
                activity.createdAt >= monthStart && activity.createdAt < monthEnd
            }

            // Count won activities for this month
            val wonCount = wonActivities.count { activity ->
                activity.closedAt != null && activity.closedAt!! >= monthStart && activity.closedAt!! < monthEnd
            }

            // Count lost activities for this month
            val lostCount = lostActivities.count { activity ->
                activity.closedAt != null && activity.closedAt!! >= monthStart && activity.closedAt!! < monthEnd
            }

            // Calculate bench weeks for this month
            val benchWeeks = calculateBenchWeeksForMonth(
                consultantsOnBoard = consultantsOnBoard,
                historyEntries = allHistoryEntries,
                monthStart = monthStart,
                monthEnd = monthEnd,
                availableFromByConsultant = availableFromByConsultant
            )

            result.add(MonthlyTrendData(
                month = monthStr,
                created = createdCount,
                won = wonCount,
                lost = lostCount,
                benchWeeks = benchWeeks
            ))
        }

        return result
    }

    /**
     * Calculate total bench weeks for all consultants in a given month.
     * A consultant is "on bench" when their status is AVAILABLE or ASSIGNED.
     * Returns the total number of work weeks (days / 5).
     */
    private fun calculateBenchWeeksForMonth(
        consultantsOnBoard: Set<Long>,
        historyEntries: List<AvailabilityHistory>,
        monthStart: LocalDateTime,
        monthEnd: LocalDateTime,
        availableFromByConsultant: Map<Long, LocalDateTime>
    ): Double {
        var totalBenchDays = 0

        for (consultantId in consultantsOnBoard) {
            // Get all history entries for this consultant
            val consultantHistory = historyEntries.filter { it.consultant.id == consultantId }
                .sortedBy { it.changedAt }

            // Find when this consultant became available
            val availableFromDate = availableFromByConsultant[consultantId]

            // If we don't know when they became available, or it's after this month, skip
            if (availableFromDate == null || availableFromDate >= monthEnd) {
                continue
            }

            // Determine when to start counting for this month
            // If they became available during this month, start from that date
            val effectiveStart = if (availableFromDate > monthStart) availableFromDate else monthStart

            // Find the initial status at the effective start from history
            // Default to AVAILABLE if they have an availableFrom date (they were marked as available)
            val statusAtStart = availabilityHistoryRepository.findLatestStatusAsOf(consultantId, effectiveStart)?.toStatus
                ?: AvailabilityStatus.AVAILABLE

            // Calculate days in bench status during this month
            var currentStatus = statusAtStart
            var periodStart = effectiveStart

            for (entry in consultantHistory) {
                if (entry.changedAt >= effectiveStart && entry.changedAt < monthEnd) {
                    // Calculate days from periodStart to this entry's changedAt
                    if (isBenchStatus(currentStatus)) {
                        val days = calculateWorkDays(periodStart, entry.changedAt)
                        totalBenchDays += days
                    }
                    currentStatus = entry.toStatus
                    periodStart = entry.changedAt
                }
            }

            // Calculate remaining days until month end
            if (isBenchStatus(currentStatus)) {
                val endDate = if (monthEnd > LocalDateTime.now()) LocalDateTime.now() else monthEnd
                if (endDate > periodStart) {
                    val days = calculateWorkDays(periodStart, endDate)
                    totalBenchDays += days
                }
            }
        }

        // Convert days to weeks (5 work days per week)
        return totalBenchDays / 5.0
    }

    private fun isBenchStatus(status: AvailabilityStatus): Boolean {
        return status == AvailabilityStatus.AVAILABLE || status == AvailabilityStatus.ASSIGNED
    }

    private fun calculateWorkDays(from: LocalDateTime, to: LocalDateTime): Int {
        // Simple calculation: total days (could be refined to exclude weekends)
        return ChronoUnit.DAYS.between(from.toLocalDate(), to.toLocalDate()).toInt().coerceAtLeast(0)
    }

    // ==================== Evaluation Analytics ====================

    data class EvaluationAnalyticsData(
        val closedReasonBreakdown: Map<ClosedReason, Int>,
        val closedReasonByStage: Map<SalesStage, Map<ClosedReason, Int>>,
        val avgMatchRatingWon: Double?,
        val avgMatchRatingLost: Double?,
        val matchRatingDistribution: List<MatchRatingBucketData>,
        val customerExperienceEffect: CustomerExperienceEffectData,
        val closedActivities: List<SalesActivity>
    )

    data class MatchRatingBucketData(
        val rating: Int,
        val wonCount: Int,
        val lostCount: Int
    )

    data class CustomerExperienceEffectData(
        val withExperienceWon: Int,
        val withExperienceLost: Int,
        val withoutExperienceWon: Int,
        val withoutExperienceLost: Int
    )

    @Transactional(readOnly = true)
    fun getEvaluationAnalytics(months: Int?): EvaluationAnalyticsData {
        val allActivities = salesActivityRepository.findAll()

        // Get all closed activities (WON or CLOSED_OTHER_WON), optionally filtered by closedAt
        val closedActivities = allActivities.filter { activity ->
            (activity.status == ActivityStatus.WON || activity.status == ActivityStatus.CLOSED_OTHER_WON) &&
                (months == null || activity.closedAt?.let {
                    it.isAfter(LocalDateTime.now().minusMonths(months.toLong()))
                } == true)
        }

        // closedReasonBreakdown: group by closedReason, count each
        val closedReasonBreakdown = closedActivities
            .filter { it.closedReason != null }
            .groupBy { it.closedReason!! }
            .mapValues { (_, activities) -> activities.size }

        // closedReasonByStage: for lost activities, group by currentStage then by reason
        val lostActivities = closedActivities.filter { it.status == ActivityStatus.CLOSED_OTHER_WON }
        val closedReasonByStage = lostActivities
            .groupBy { it.currentStage }
            .mapValues { (_, activities) ->
                activities.filter { it.closedReason != null }
                    .groupBy { it.closedReason!! }
                    .mapValues { (_, acts) -> acts.size }
            }

        // avgMatchRatingWon
        val wonActivities = closedActivities.filter { it.status == ActivityStatus.WON }
        val wonRatings = wonActivities.mapNotNull { it.matchRating }
        val avgMatchRatingWon = if (wonRatings.isNotEmpty()) wonRatings.average() else null

        // avgMatchRatingLost
        val lostRatings = lostActivities.mapNotNull { it.matchRating }
        val avgMatchRatingLost = if (lostRatings.isNotEmpty()) lostRatings.average() else null

        // matchRatingDistribution: for ratings 1-5, count won and lost with that rating
        val matchRatingDistribution = (1..5).map { rating ->
            MatchRatingBucketData(
                rating = rating,
                wonCount = wonActivities.count { it.matchRating == rating },
                lostCount = lostActivities.count { it.matchRating == rating }
            )
        }

        // customerExperienceEffect
        var withExperienceWon = 0
        var withExperienceLost = 0
        var withoutExperienceWon = 0
        var withoutExperienceLost = 0

        for (activity in closedActivities) {
            val consultantId = activity.consultant.id!!
            val customerKey = activity.customer?.id?.toString() ?: activity.customerName

            // Check if consultant has any EARLIER WON activity for the same customer
            val hasEarlierWon = if (customerKey != null) {
                allActivities.any { other ->
                    other.id != activity.id &&
                        other.consultant.id == consultantId &&
                        other.status == ActivityStatus.WON &&
                        other.closedAt != null &&
                        activity.closedAt != null &&
                        other.closedAt!!.isBefore(activity.closedAt) &&
                        (other.customer?.id?.toString() ?: other.customerName) == customerKey
                }
            } else false

            when {
                hasEarlierWon && activity.status == ActivityStatus.WON -> withExperienceWon++
                hasEarlierWon && activity.status == ActivityStatus.CLOSED_OTHER_WON -> withExperienceLost++
                !hasEarlierWon && activity.status == ActivityStatus.WON -> withoutExperienceWon++
                !hasEarlierWon && activity.status == ActivityStatus.CLOSED_OTHER_WON -> withoutExperienceLost++
            }
        }

        return EvaluationAnalyticsData(
            closedReasonBreakdown = closedReasonBreakdown,
            closedReasonByStage = closedReasonByStage,
            avgMatchRatingWon = avgMatchRatingWon,
            avgMatchRatingLost = avgMatchRatingLost,
            matchRatingDistribution = matchRatingDistribution,
            customerExperienceEffect = CustomerExperienceEffectData(
                withExperienceWon = withExperienceWon,
                withExperienceLost = withExperienceLost,
                withoutExperienceWon = withoutExperienceWon,
                withoutExperienceLost = withoutExperienceLost
            ),
            closedActivities = closedActivities
        )
    }

    // ==================== Consultant Analytics ====================

    data class ConsultantDetailedStatsData(
        val consultant: User,
        val availabilityStatus: AvailabilityStatus?,
        val activeActivities: Int,
        val wonTotal: Int,
        val lostTotal: Int,
        val winRate: Double,
        val avgMatchRating: Double?,
        val avgDaysToClose: Double,
        val mostCommonLossReason: ClosedReason?,
        val activities: List<SalesActivity>
    )

    @Transactional(readOnly = true)
    fun getConsultantAnalytics(): List<ConsultantDetailedStatsData> {
        val allActivities = salesActivityRepository.findAll()
        val availabilities = consultantAvailabilityRepository.findAll()
        val availabilityByConsultant = availabilities.associateBy { it.consultant.id!! }

        return allActivities.groupBy { it.consultant }
            .map { (consultant, activities) ->
                val active = activities.count { it.status == ActivityStatus.ACTIVE }
                val won = activities.count { it.status == ActivityStatus.WON }
                val lost = activities.count { it.status == ActivityStatus.CLOSED_OTHER_WON }
                val winRate = if (won + lost > 0) (won.toDouble() / (won + lost)) * 100 else 0.0

                val ratings = activities.mapNotNull { it.matchRating }
                val avgMatchRating = if (ratings.isNotEmpty()) ratings.average() else null

                val closedWithDates = activities.filter { it.closedAt != null }
                val avgDaysToClose = if (closedWithDates.isNotEmpty()) {
                    closedWithDates.map { activity ->
                        ChronoUnit.DAYS.between(activity.createdAt, activity.closedAt!!).toDouble()
                    }.average()
                } else 0.0

                val lostActivities = activities.filter { it.status == ActivityStatus.CLOSED_OTHER_WON }
                val mostCommonLossReason = lostActivities
                    .mapNotNull { it.closedReason }
                    .groupBy { it }
                    .maxByOrNull { it.value.size }
                    ?.key

                val availability = availabilityByConsultant[consultant.id!!]

                ConsultantDetailedStatsData(
                    consultant = consultant,
                    availabilityStatus = availability?.status,
                    activeActivities = active,
                    wonTotal = won,
                    lostTotal = lost,
                    winRate = winRate,
                    avgMatchRating = avgMatchRating,
                    avgDaysToClose = avgDaysToClose,
                    mostCommonLossReason = mostCommonLossReason,
                    activities = activities
                )
            }
            .sortedByDescending { it.activeActivities }
    }

    // ==================== Competency Base Analytics ====================

    data class CompetencyBaseAnalyticsData(
        val availabilityStats: AvailabilityStatsData,
        val upcomingAvailable: List<UpcomingAvailableData>,
        val sectorDistribution: List<SectorDistributionData>,
        val techCategoryDistribution: List<TechCategoryCountData>,
        val skillGap: List<SkillGapEntryData>,
        val tagAnalysis: List<TagGapEntryData>
    )

    data class UpcomingAvailableData(
        val consultant: User,
        val availableFrom: LocalDate?,
        val currentCustomerName: String?
    )

    data class SectorDistributionData(
        val sector: CustomerSector,
        val customerCount: Int,
        val consultantCount: Int
    )

    data class TechCategoryCountData(
        val techCategory: String,
        val count: Int
    )

    data class SkillGapEntryData(
        val techCategory: String,
        val demanded: Int,
        val won: Int,
        val hitRate: Double
    )

    data class TagGapEntryData(
        val tagName: String,
        val demanded: Int,
        val won: Int,
        val hitRate: Double
    )

    @Transactional(readOnly = true)
    fun getCompetencyBaseAnalytics(months: Int?): CompetencyBaseAnalyticsData {
        val effectiveMonths = months ?: 12

        // 1. Reuse availability stats calculation (same as in getAnalytics)
        val totalConsultants = settingsRepository.findSettingBySettingId("totalConsultants")
            ?.settingValue?.toIntOrNull() ?: 63
        val availabilities = consultantAvailabilityRepository.findAll()
        val available = availabilities.count { it.status == AvailabilityStatus.AVAILABLE }
        val availableSoon = availabilities.count { it.status == AvailabilityStatus.AVAILABLE_SOON }
        val assigned = availabilities.count { it.status == AvailabilityStatus.ASSIGNED }
        val occupied = totalConsultants - available
        val availabilityStats = AvailabilityStatsData(
            totalConsultants = totalConsultants,
            available = available,
            availableSoon = availableSoon,
            assigned = assigned,
            occupied = occupied.coerceAtLeast(0)
        )

        // 2. upcomingAvailable: AVAILABLE_SOON consultants sorted by availableFrom
        val upcomingAvailable = availabilities
            .filter { it.status == AvailabilityStatus.AVAILABLE_SOON }
            .sortedBy { it.availableFrom }
            .map { avail ->
                UpcomingAvailableData(
                    consultant = avail.consultant,
                    availableFrom = avail.availableFrom,
                    currentCustomerName = avail.currentCustomer?.name
                )
            }

        // 3. sectorDistribution: group occupied consultants by customer.sector
        val occupiedAvailabilities = availabilities.filter {
            it.currentCustomer != null && (it.status == AvailabilityStatus.OCCUPIED || it.status == AvailabilityStatus.ASSIGNED)
        }
        val sectorDistribution = occupiedAvailabilities
            .groupBy { it.currentCustomer!!.sector }
            .map { (sector, avails) ->
                val customers = avails.mapNotNull { it.currentCustomer }.distinctBy { it.id }
                SectorDistributionData(
                    sector = sector,
                    customerCount = customers.size,
                    consultantCount = avails.size
                )
            }

        // 4. techCategoryDistribution: for occupied consultants, find most recent WON activity, get techCategory
        val allActivities = salesActivityRepository.findAll()
        val techCategoryCounts = mutableMapOf<String, Int>()
        for (avail in occupiedAvailabilities) {
            val consultantId = avail.consultant.id!!
            val mostRecentWon = allActivities
                .filter { it.consultant.id == consultantId && it.status == ActivityStatus.WON }
                .maxByOrNull { it.closedAt ?: LocalDateTime.MIN }

            val techCategory = mostRecentWon?.jobPosting?.techCategory?.name ?: "UNKNOWN"
            techCategoryCounts[techCategory] = (techCategoryCounts[techCategory] ?: 0) + 1
        }
        val techCategoryDistribution = techCategoryCounts.map { (cat, count) ->
            TechCategoryCountData(techCategory = cat, count = count)
        }.sortedByDescending { it.count }

        // 5. skillGap: count jobPostings by techCategory in period, count WON activities by techCategory
        val now = LocalDateTime.now()
        val periodStart = now.minusMonths(effectiveMonths.toLong())
        val periodStartOffset = periodStart.atOffset(java.time.ZoneOffset.UTC)

        val allJobPostings = jobPostingRepository.findAll()
        val jobPostingsInPeriod = allJobPostings.filter { jp ->
            jp.createdDate?.let { it.isAfter(periodStartOffset) || it.isEqual(periodStartOffset) } == true
        }

        val wonActivitiesInPeriod = allActivities.filter {
            it.status == ActivityStatus.WON &&
                it.closedAt != null &&
                it.closedAt!!.isAfter(periodStart)
        }

        // Group job postings by tech category
        val demandedByCategory = jobPostingsInPeriod
            .groupBy { it.techCategory?.name ?: "UNKNOWN" }
            .mapValues { (_, postings) -> postings.size }

        // Group won activities by their jobPosting's tech category
        val wonByCategory = wonActivitiesInPeriod
            .filter { it.jobPosting != null }
            .groupBy { it.jobPosting!!.techCategory?.name ?: "UNKNOWN" }
            .mapValues { (_, acts) -> acts.size }

        val allCategories = (demandedByCategory.keys + wonByCategory.keys).toSet()
        val skillGap = allCategories.map { category ->
            val demanded = demandedByCategory[category] ?: 0
            val won = wonByCategory[category] ?: 0
            val hitRate = if (demanded > 0) (won.toDouble() / demanded) * 100 else 0.0
            SkillGapEntryData(
                techCategory = category,
                demanded = demanded,
                won = won,
                hitRate = hitRate
            )
        }.sortedByDescending { it.demanded }

        // 6. tagAnalysis: similar but by tag name
        val tagDemanded = mutableMapOf<String, Int>()
        for (jp in jobPostingsInPeriod) {
            for (tag in jp.tags) {
                tagDemanded[tag.name] = (tagDemanded[tag.name] ?: 0) + 1
            }
        }

        val tagWon = mutableMapOf<String, Int>()
        for (activity in wonActivitiesInPeriod) {
            activity.jobPosting?.let { jp ->
                for (tag in jp.tags) {
                    tagWon[tag.name] = (tagWon[tag.name] ?: 0) + 1
                }
            }
        }

        val tagAnalysis = tagDemanded.entries
            .sortedByDescending { it.value }
            .take(15)
            .map { (tagName, demanded) ->
                val won = tagWon[tagName] ?: 0
                val hitRate = if (demanded > 0) (won.toDouble() / demanded) * 100 else 0.0
                TagGapEntryData(
                    tagName = tagName,
                    demanded = demanded,
                    won = won,
                    hitRate = hitRate
                )
            }

        return CompetencyBaseAnalyticsData(
            availabilityStats = availabilityStats,
            upcomingAvailable = upcomingAvailable,
            sectorDistribution = sectorDistribution,
            techCategoryDistribution = techCategoryDistribution,
            skillGap = skillGap,
            tagAnalysis = tagAnalysis
        )
    }

    // ==================== Customer Analytics ====================

    data class CustomerAnalyticsData(
        val customers: List<CustomerDetailedStatsData>,
        val sectorComparison: List<SectorDistributionData>,
        val supplierStats: List<SupplierStatsData>,
        val sourceStats: List<SourceStatsData>
    )

    data class CustomerDetailedStatsData(
        val customerId: Long?,
        val customerName: String,
        val sector: CustomerSector?,
        val currentConsultantCount: Int,
        val activeActivities: Int,
        val wonTotal: Int,
        val lostTotal: Int,
        val winRate: Double,
        val mostCommonLossReason: ClosedReason?
    )

    data class SupplierStatsData(
        val supplierName: String,
        val totalActivities: Int,
        val wonTotal: Int,
        val lostTotal: Int,
        val winRate: Double
    )

    data class SourceStatsData(
        val source: String,
        val totalJobPostings: Int,
        val wonActivities: Int,
        val lostActivities: Int,
        val winRate: Double
    )

    @Transactional(readOnly = true)
    fun getCustomerAnalytics(months: Int?): CustomerAnalyticsData {
        val allActivities = salesActivityRepository.findAll()

        // Optionally filter by createdAt within months
        val activities = if (months != null) {
            val cutoff = LocalDateTime.now().minusMonths(months.toLong())
            allActivities.filter { it.createdAt.isAfter(cutoff) }
        } else {
            allActivities
        }

        val availabilities = consultantAvailabilityRepository.findAll()

        // Group by customer (using customer entity or customerName)
        val customerGroups = activities.groupBy { activity ->
            activity.customer?.id?.toString() ?: activity.customerName ?: "Ukjent"
        }

        val customers = customerGroups.map { (customerKey, customerActivities) ->
            val firstActivity = customerActivities.first()
            val customer = firstActivity.customer
            val customerName = customer?.name ?: firstActivity.customerName ?: "Ukjent"
            val sector = customer?.sector

            // currentConsultantCount from availabilities where currentCustomer matches
            val currentConsultantCount = if (customer != null) {
                availabilities.count { it.currentCustomer?.id == customer.id }
            } else {
                0
            }

            val active = customerActivities.count { it.status == ActivityStatus.ACTIVE }
            val won = customerActivities.count { it.status == ActivityStatus.WON }
            val lost = customerActivities.count { it.status == ActivityStatus.CLOSED_OTHER_WON }
            val winRate = if (won + lost > 0) (won.toDouble() / (won + lost)) * 100 else 0.0

            val mostCommonLossReason = customerActivities
                .filter { it.status == ActivityStatus.CLOSED_OTHER_WON }
                .mapNotNull { it.closedReason }
                .groupBy { it }
                .maxByOrNull { it.value.size }
                ?.key

            CustomerDetailedStatsData(
                customerId = customer?.id,
                customerName = customerName,
                sector = sector,
                currentConsultantCount = currentConsultantCount,
                activeActivities = active,
                wonTotal = won,
                lostTotal = lost,
                winRate = winRate,
                mostCommonLossReason = mostCommonLossReason
            )
        }.sortedByDescending { it.activeActivities + it.wonTotal }

        // sectorComparison: aggregate by sector
        val sectorComparison = CustomerSector.entries.map { sector ->
            val sectorCustomers = customers.filter { it.sector == sector }
            SectorDistributionData(
                sector = sector,
                customerCount = sectorCustomers.size,
                consultantCount = sectorCustomers.sumOf { it.currentConsultantCount }
            )
        }

        // supplierStats: group activities by supplierName
        val supplierStats = activities
            .filter { !it.supplierName.isNullOrBlank() }
            .groupBy { it.supplierName!! }
            .map { (supplierName, supplierActivities) ->
                val won = supplierActivities.count { it.status == ActivityStatus.WON }
                val lost = supplierActivities.count { it.status == ActivityStatus.CLOSED_OTHER_WON }
                val winRate = if (won + lost > 0) (won.toDouble() / (won + lost)) * 100 else 0.0
                SupplierStatsData(
                    supplierName = supplierName,
                    totalActivities = supplierActivities.size,
                    wonTotal = won,
                    lostTotal = lost,
                    winRate = winRate
                )
            }.sortedByDescending { it.totalActivities }

        // sourceStats: for activities with jobPosting, group by jobPosting.source
        val activitiesWithJobPosting = activities.filter { it.jobPosting != null }
        val sourceStats = activitiesWithJobPosting
            .groupBy { it.jobPosting!!.source?.name ?: "UNKNOWN" }
            .map { (source, sourceActivities) ->
                val jobPostingIds = sourceActivities.mapNotNull { it.jobPosting?.id }.distinct()
                val won = sourceActivities.count { it.status == ActivityStatus.WON }
                val lost = sourceActivities.count { it.status == ActivityStatus.CLOSED_OTHER_WON }
                val winRate = if (won + lost > 0) (won.toDouble() / (won + lost)) * 100 else 0.0
                SourceStatsData(
                    source = source,
                    totalJobPostings = jobPostingIds.size,
                    wonActivities = won,
                    lostActivities = lost,
                    winRate = winRate
                )
            }.sortedByDescending { it.totalJobPostings }

        return CustomerAnalyticsData(
            customers = customers,
            sectorComparison = sectorComparison,
            supplierStats = supplierStats,
            sourceStats = sourceStats
        )
    }
}
