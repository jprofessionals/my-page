package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.ActivityStatus
import no.jpro.mypageapi.entity.AvailabilityHistory
import no.jpro.mypageapi.entity.AvailabilityStatus
import no.jpro.mypageapi.entity.ClosedReason
import no.jpro.mypageapi.entity.ConsultantAvailability
import no.jpro.mypageapi.entity.SalesActivity
import no.jpro.mypageapi.entity.SalesStage
import no.jpro.mypageapi.entity.SalesStageHistory
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.AvailabilityHistoryRepository
import no.jpro.mypageapi.repository.ConsultantAvailabilityRepository
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.SalesActivityRepository
import no.jpro.mypageapi.repository.SalesStageHistoryRepository
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.stereotype.Service
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
        createdBy: User
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
    fun markActivityWon(id: Long, changedBy: User, actualStartDate: LocalDate? = null): SalesActivity {
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
        closedBy: User
    ): SalesActivity {
        val activity = salesActivityRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Activity not found: $id") }

        if (activity.status != ActivityStatus.ACTIVE) {
            throw IllegalStateException("Activity is already closed")
        }

        activity.status = ActivityStatus.CLOSED_OTHER_WON // Using this as general closed state
        activity.closedReason = reason
        activity.closedReasonNote = reasonNote
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
        val createdThisMonth: Int,
        val createdThisQuarter: Int,
        val createdThisYear: Int,
        // Previous period (for comparison)
        val wonLastMonth: Int,
        val wonLastQuarter: Int,
        val wonLastYear: Int,
        val lostLastMonth: Int,
        val lostLastQuarter: Int,
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
        val availabilityStats: AvailabilityStatsData
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
        val available: Int,
        val availableSoon: Int,
        val assigned: Int,
        val occupied: Int
    )

    @Transactional(readOnly = true)
    fun getAnalytics(): AnalyticsData {
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

        // Lost activities - previous period
        val lostLastMonth = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.CLOSED_OTHER_WON, startOfLastMonth, endOfLastMonth).size
        val lostLastQuarter = salesActivityRepository.findByStatusAndClosedAtBetween(ActivityStatus.CLOSED_OTHER_WON, startOfLastQuarter, endOfLastQuarter).size

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

        // Availability stats
        val availabilities = consultantAvailabilityRepository.findAll()
        val availabilityStats = AvailabilityStatsData(
            available = availabilities.count { it.status == AvailabilityStatus.AVAILABLE },
            availableSoon = availabilities.count { it.status == AvailabilityStatus.AVAILABLE_SOON },
            assigned = availabilities.count { it.status == AvailabilityStatus.ASSIGNED },
            occupied = availabilities.count { it.status == AvailabilityStatus.OCCUPIED }
        )

        return AnalyticsData(
            totalActiveActivities = totalActiveActivities,
            wonThisMonth = wonThisMonth,
            wonThisQuarter = wonThisQuarter,
            wonThisYear = wonThisYear,
            lostThisMonth = lostThisMonth,
            lostThisQuarter = lostThisQuarter,
            createdThisMonth = createdThisMonth,
            createdThisQuarter = createdThisQuarter,
            createdThisYear = createdThisYear,
            wonLastMonth = wonLastMonth,
            wonLastQuarter = wonLastQuarter,
            wonLastYear = wonLastYear,
            lostLastMonth = lostLastMonth,
            lostLastQuarter = lostLastQuarter,
            createdLastMonth = createdLastMonth,
            createdLastQuarter = createdLastQuarter,
            createdLastYear = createdLastYear,
            conversionRate = conversionRate,
            averageDaysToClose = averageDaysToClose,
            activitiesByStage = activitiesByStage,
            consultantStats = consultantStats,
            customerStats = customerStats,
            closedReasonStats = closedReasonStats,
            availabilityStats = availabilityStats
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
}
