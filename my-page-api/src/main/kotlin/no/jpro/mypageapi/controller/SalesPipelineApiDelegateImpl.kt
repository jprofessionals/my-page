package no.jpro.mypageapi.controller

import jakarta.persistence.EntityNotFoundException
import no.jpro.mypageapi.api.SalesPipelineApiDelegate
import no.jpro.mypageapi.entity.ActivityStatus
import no.jpro.mypageapi.entity.ClosedReason
import no.jpro.mypageapi.entity.SalesStage
import no.jpro.mypageapi.model.AddConsultantToBoardRequest
import no.jpro.mypageapi.model.CloseActivity
import no.jpro.mypageapi.model.ClosedReasonByStage
import no.jpro.mypageapi.model.CompetencyBaseAnalytics
import no.jpro.mypageapi.model.ConsultantDetailedStats
import no.jpro.mypageapi.model.CreateInterviewRound
import no.jpro.mypageapi.model.CustomerAnalytics
import no.jpro.mypageapi.model.CustomerDetailedStats
import no.jpro.mypageapi.model.CustomerExperienceEffect
import no.jpro.mypageapi.model.EvaluationAnalytics
import no.jpro.mypageapi.model.MatchRatingBucket
import no.jpro.mypageapi.model.SectorDistribution
import no.jpro.mypageapi.model.SkillGapEntry
import no.jpro.mypageapi.model.SourceStats
import no.jpro.mypageapi.model.SupplierStats
import no.jpro.mypageapi.model.TagGapEntry
import no.jpro.mypageapi.model.TechCategoryCount
import no.jpro.mypageapi.model.UpdateInterviewRound
import no.jpro.mypageapi.model.UpcomingAvailableConsultant
import no.jpro.mypageapi.model.InterviewRound as InterviewRoundModel
import no.jpro.mypageapi.model.AvailabilityStats
import no.jpro.mypageapi.model.BenchAnalytics
import no.jpro.mypageapi.model.CurrentBenchConsultant
import no.jpro.mypageapi.model.MonthlyInvoluntaryBench
import no.jpro.mypageapi.model.MonthlyTrendData
import no.jpro.mypageapi.model.YearlyBenchSummary
import no.jpro.mypageapi.model.ClosedReasonCount
import no.jpro.mypageapi.model.ConsultantActivityStats
import no.jpro.mypageapi.model.ConsultantWithActivities
import no.jpro.mypageapi.model.CreateSalesActivity
import no.jpro.mypageapi.model.CustomerActivityStats
import no.jpro.mypageapi.model.FlowcaseConsultant
import no.jpro.mypageapi.model.FunnelStageData
import no.jpro.mypageapi.model.MarkActivityWonRequest
import no.jpro.mypageapi.model.ReorderConsultantsRequest
import no.jpro.mypageapi.model.SalesPipelineAnalytics
import no.jpro.mypageapi.model.SalesPipelineBoard
import no.jpro.mypageapi.model.StageCount
import no.jpro.mypageapi.model.UpdateConsultantAvailability
import no.jpro.mypageapi.model.UpdateSalesActivity
import no.jpro.mypageapi.model.UpdateStage
import no.jpro.mypageapi.service.FlowcaseService
import no.jpro.mypageapi.service.SalesPipelineService
import no.jpro.mypageapi.utils.AuthenticationHelper
import no.jpro.mypageapi.utils.mapper.SalesPipelineMapper
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.time.OffsetDateTime
import java.time.ZoneId
import java.util.*
import no.jpro.mypageapi.model.ConsultantAvailability as ConsultantAvailabilityModel
import no.jpro.mypageapi.model.SalesActivity as SalesActivityModel
import no.jpro.mypageapi.model.SalesActivityWithHistory as SalesActivityWithHistoryModel
import no.jpro.mypageapi.model.AvailabilityStatus as AvailabilityStatusModel
import no.jpro.mypageapi.model.ClosedReason as ClosedReasonModel
import no.jpro.mypageapi.model.SalesStage as SalesStageModel

@Service
class SalesPipelineApiDelegateImpl(
    private val salesPipelineService: SalesPipelineService,
    private val flowcaseService: FlowcaseService,
    private val salesPipelineMapper: SalesPipelineMapper,
    private val authHelper: AuthenticationHelper,
    private val request: Optional<NativeWebRequest>
) : SalesPipelineApiDelegate {

    companion object {
        // Use explicit timezone for consistent conversion
        private val OSLO_ZONE = ZoneId.of("Europe/Oslo")
    }

    override fun getRequest(): Optional<NativeWebRequest> = request

    private fun getTestUserId(): String? =
        getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)

    /**
     * Convert OffsetDateTime to LocalDateTime in Oslo timezone.
     * This ensures the time displayed to users matches what they entered,
     * regardless of server timezone settings.
     */
    private fun OffsetDateTime.toOsloLocalDateTime() =
        this.atZoneSameInstant(OSLO_ZONE).toLocalDateTime()

    // ==================== Flowcase Consultants ====================

    override fun getFlowcaseConsultants(query: String?): ResponseEntity<List<FlowcaseConsultant>> {
        val consultants = if (query.isNullOrBlank()) {
            flowcaseService.getConsultants()
        } else {
            flowcaseService.searchConsultants(query)
        }

        val models = consultants.map { dto ->
            FlowcaseConsultant(
                id = dto.id,
                email = dto.email,
                name = dto.name,
                imageUrl = dto.imageUrl
            )
        }

        return ResponseEntity.ok(models)
    }

    override fun addConsultantToBoard(
        addConsultantToBoardRequest: AddConsultantToBoardRequest
    ): ResponseEntity<ConsultantAvailabilityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        // Validate that either consultantId or flowcaseEmail is provided
        if (addConsultantToBoardRequest.consultantId == null && addConsultantToBoardRequest.flowcaseEmail.isNullOrBlank()) {
            return ResponseEntity.badRequest().build()
        }

        val status = addConsultantToBoardRequest.availabilityStatus?.let {
            no.jpro.mypageapi.entity.AvailabilityStatus.valueOf(it.name)
        }

        try {
            val availability = salesPipelineService.addConsultantToBoard(
                consultantId = addConsultantToBoardRequest.consultantId,
                flowcaseEmail = addConsultantToBoardRequest.flowcaseEmail,
                flowcaseName = null, // Could be added to the request if needed
                status = status,
                notes = addConsultantToBoardRequest.notes,
                addedBy = currentUser
            )

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(salesPipelineMapper.toConsultantAvailabilityModel(availability))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().build()
        }
    }

    // ==================== Consultant Availability ====================

    override fun getAllConsultantAvailability(): ResponseEntity<List<ConsultantAvailabilityModel>> {
        val availabilities = salesPipelineService.getAllConsultantAvailability()
        val models = availabilities.map { salesPipelineMapper.toConsultantAvailabilityModel(it) }
        return ResponseEntity.ok(models)
    }

    override fun getConsultantAvailability(userId: Long): ResponseEntity<ConsultantAvailabilityModel> {
        val availability = salesPipelineService.getConsultantAvailability(userId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(salesPipelineMapper.toConsultantAvailabilityModel(availability))
    }

    override fun updateConsultantAvailability(
        userId: Long,
        updateConsultantAvailability: UpdateConsultantAvailability
    ): ResponseEntity<ConsultantAvailabilityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        val status = no.jpro.mypageapi.entity.AvailabilityStatus.valueOf(updateConsultantAvailability.status.name)

        val availability = salesPipelineService.updateConsultantAvailability(
            consultantId = userId,
            status = status,
            availableFrom = updateConsultantAvailability.availableFrom,
            currentCustomerId = updateConsultantAvailability.currentCustomerId,
            notes = updateConsultantAvailability.notes,
            updatedBy = currentUser
        )

        return ResponseEntity.ok(salesPipelineMapper.toConsultantAvailabilityModel(availability))
    }

    // ==================== Sales Activities ====================

    override fun getSalesActivities(status: String?): ResponseEntity<List<SalesActivityModel>> {
        val activityStatus = status?.let {
            try { ActivityStatus.valueOf(it) } catch (e: Exception) { null }
        }
        val activities = salesPipelineService.getAllSalesActivities(activityStatus)
        val models = activities.map { salesPipelineMapper.toSalesActivityModel(it) }
        return ResponseEntity.ok(models)
    }

    override fun getSalesActivitiesByConsultant(
        userId: Long,
        includeInactive: Boolean
    ): ResponseEntity<List<SalesActivityModel>> {
        val activityStatus = if (includeInactive) null else ActivityStatus.ACTIVE
        val activities = salesPipelineService.getSalesActivitiesByConsultant(userId, activityStatus)
        val models = activities.map { salesPipelineMapper.toSalesActivityModel(it) }
        return ResponseEntity.ok(models)
    }

    override fun getSalesActivitiesByCustomer(
        customerId: Long,
        includeInactive: Boolean
    ): ResponseEntity<List<SalesActivityModel>> {
        val activityStatus = if (includeInactive) null else ActivityStatus.ACTIVE
        val activities = salesPipelineService.getSalesActivitiesByCustomer(customerId, activityStatus)
        val models = activities.map { salesPipelineMapper.toSalesActivityModel(it) }
        return ResponseEntity.ok(models)
    }

    override fun getSalesActivity(id: Long): ResponseEntity<SalesActivityWithHistoryModel> {
        val activity = salesPipelineService.getSalesActivity(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(salesPipelineMapper.toSalesActivityWithHistoryModel(activity))
    }

    override fun createSalesActivity(
        createSalesActivity: CreateSalesActivity
    ): ResponseEntity<SalesActivityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        // Validate that either consultantId or flowcaseEmail is provided
        if (createSalesActivity.consultantId == null && createSalesActivity.flowcaseEmail.isNullOrBlank()) {
            return ResponseEntity.badRequest().build()
        }

        val stage = createSalesActivity.currentStage?.let {
            SalesStage.valueOf(it.name)
        } ?: SalesStage.INTERESTED

        try {
            val activity = salesPipelineService.createSalesActivity(
                consultantId = createSalesActivity.consultantId,
                flowcaseEmail = createSalesActivity.flowcaseEmail,
                flowcaseName = createSalesActivity.flowcaseName,
                customerId = createSalesActivity.customerId,
                customerName = createSalesActivity.customerName,
                supplierName = createSalesActivity.supplierName,
                title = createSalesActivity.title,
                stage = stage,
                notes = createSalesActivity.notes,
                maxPrice = createSalesActivity.maxPrice,
                offeredPrice = createSalesActivity.offeredPrice,
                expectedStartDate = createSalesActivity.expectedStartDate,
                offerDeadline = createSalesActivity.offerDeadline?.toOsloLocalDateTime(),
                offerDeadlineAsap = createSalesActivity.offerDeadlineAsap,
                interviewDate = createSalesActivity.interviewDate?.toOsloLocalDateTime(),
                createdBy = currentUser,
                jobPostingId = createSalesActivity.jobPostingId
            )

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(salesPipelineMapper.toSalesActivityModel(activity))
        } catch (e: EntityNotFoundException) {
            return ResponseEntity.notFound().build()
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().build()
        }
    }

    override fun updateSalesActivity(
        id: Long,
        updateSalesActivity: UpdateSalesActivity
    ): ResponseEntity<SalesActivityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val activity = salesPipelineService.updateSalesActivity(
                id = id,
                customerId = updateSalesActivity.customerId,
                customerName = updateSalesActivity.customerName,
                supplierName = updateSalesActivity.supplierName,
                title = updateSalesActivity.title,
                notes = updateSalesActivity.notes,
                maxPrice = updateSalesActivity.maxPrice,
                offeredPrice = updateSalesActivity.offeredPrice,
                expectedStartDate = updateSalesActivity.expectedStartDate,
                offerDeadline = updateSalesActivity.offerDeadline?.toOsloLocalDateTime(),
                offerDeadlineAsap = updateSalesActivity.offerDeadlineAsap,
                interviewDate = updateSalesActivity.interviewDate?.toOsloLocalDateTime(),
                updatedBy = currentUser
            )
            return ResponseEntity.ok(salesPipelineMapper.toSalesActivityModel(activity))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().build()
        }
    }

    override fun updateSalesActivityStage(
        id: Long,
        updateStage: UpdateStage
    ): ResponseEntity<SalesActivityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val newStage = SalesStage.valueOf(updateStage.stage.name)
            val activity = salesPipelineService.updateSalesActivityStage(id, newStage, currentUser)
            return ResponseEntity.ok(salesPipelineMapper.toSalesActivityModel(activity))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().build()
        }
    }

    override fun markSalesActivityWon(
        id: Long,
        markActivityWonRequest: MarkActivityWonRequest?
    ): ResponseEntity<SalesActivityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val activity = salesPipelineService.markActivityWon(
                id,
                currentUser,
                markActivityWonRequest?.actualStartDate,
                markActivityWonRequest?.matchRating,
                markActivityWonRequest?.evaluationNotes,
                markActivityWonRequest?.evaluationDocumentUrl,
                markActivityWonRequest?.keyFactors?.joinToString(",") { it.name }
            )
            return ResponseEntity.ok(salesPipelineMapper.toSalesActivityModel(activity))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().build()
        }
    }

    override fun closeSalesActivity(
        id: Long,
        closeActivity: CloseActivity
    ): ResponseEntity<SalesActivityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val reason = ClosedReason.valueOf(closeActivity.reason.name)
            val activity = salesPipelineService.closeActivity(
                id,
                reason,
                closeActivity.note,
                currentUser,
                closeActivity.matchRating,
                closeActivity.evaluationNotes,
                closeActivity.evaluationDocumentUrl,
                closeActivity.keyFactors?.joinToString(",") { it.name }
            )
            return ResponseEntity.ok(salesPipelineMapper.toSalesActivityModel(activity))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().build()
        }
    }

    override fun deleteSalesActivity(id: Long): ResponseEntity<Unit> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            salesPipelineService.deleteActivity(id)
            return ResponseEntity.noContent().build()
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        }
    }

    // ==================== Interview Rounds ====================

    override fun getInterviewRounds(id: Long): ResponseEntity<List<InterviewRoundModel>> {
        val activity = salesPipelineService.getSalesActivity(id)
            ?: return ResponseEntity.notFound().build()

        val rounds = salesPipelineService.getInterviewRounds(id)
        return ResponseEntity.ok(rounds.map { salesPipelineMapper.toInterviewRoundModel(it) })
    }

    override fun addInterviewRound(
        id: Long,
        createInterviewRound: CreateInterviewRound
    ): ResponseEntity<InterviewRoundModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val round = salesPipelineService.addInterviewRound(
                activityId = id,
                interviewDate = createInterviewRound.interviewDate?.toOsloLocalDateTime(),
                notes = createInterviewRound.notes
            )
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(salesPipelineMapper.toInterviewRoundModel(round))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        }
    }

    override fun updateInterviewRound(
        id: Long,
        roundId: Long,
        updateInterviewRound: UpdateInterviewRound
    ): ResponseEntity<InterviewRoundModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val round = salesPipelineService.updateInterviewRound(
                roundId = roundId,
                interviewDate = updateInterviewRound.interviewDate?.toOsloLocalDateTime(),
                notes = updateInterviewRound.notes
            )
            return ResponseEntity.ok(salesPipelineMapper.toInterviewRoundModel(round))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        }
    }

    override fun deleteInterviewRound(id: Long, roundId: Long): ResponseEntity<Unit> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            salesPipelineService.deleteInterviewRound(roundId)
            return ResponseEntity.noContent().build()
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        }
    }

    override fun removeConsultantFromPipeline(userId: Long): ResponseEntity<Unit> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            salesPipelineService.removeConsultantFromPipeline(userId)
            return ResponseEntity.noContent().build()
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.notFound().build()
        }
    }

    // ==================== Pipeline Board ====================

    override fun getSalesPipelineBoard(): ResponseEntity<SalesPipelineBoard> {
        val activeActivities = salesPipelineService.getAllSalesActivities(ActivityStatus.ACTIVE)
        val availabilities = salesPipelineService.getAllConsultantAvailability()

        // Group activities by consultant
        val activitiesByConsultant = activeActivities.groupBy { it.consultant.id!! }
        val availabilityByConsultant = availabilities.associateBy { it.consultant.id!! }

        // Get all consultants that either have activities or availability entries
        val consultantIds = (activitiesByConsultant.keys + availabilityByConsultant.keys).toSet()

        // Build consultant with activities list
        val consultantsWithActivities = consultantIds.mapNotNull { consultantId ->
            val activities = activitiesByConsultant[consultantId] ?: emptyList()
            val availability = availabilityByConsultant[consultantId]

            // Get consultant from either activities or availability
            val consultant = activities.firstOrNull()?.consultant
                ?: availability?.consultant
                ?: return@mapNotNull null

            ConsultantWithActivities(
                consultant = salesPipelineMapper.userMapper.toUserModel(consultant),
                activities = activities.map { salesPipelineMapper.toSalesActivityModel(it) },
                availability = availability?.let { salesPipelineMapper.toConsultantAvailabilityModel(it) }
            )
        }.sortedBy { it.availability?.displayOrder ?: Int.MAX_VALUE }

        // All stages
        val stages = SalesStage.entries.map { SalesStageModel.valueOf(it.name) }

        val board = SalesPipelineBoard(
            consultants = consultantsWithActivities,
            stages = stages
        )

        return ResponseEntity.ok(board)
    }

    override fun reorderConsultants(
        reorderConsultantsRequest: ReorderConsultantsRequest
    ): ResponseEntity<Unit> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        salesPipelineService.reorderConsultants(reorderConsultantsRequest.consultantIds)
        return ResponseEntity.ok().build()
    }

    // ==================== Analytics ====================

    override fun getSalesPipelineAnalytics(funnelMonths: Int?): ResponseEntity<SalesPipelineAnalytics> {
        val analytics = salesPipelineService.getAnalytics(funnelMonths)

        val response = SalesPipelineAnalytics(
            totalActiveActivities = analytics.totalActiveActivities.toInt(),
            // Current period
            wonThisMonth = analytics.wonThisMonth,
            wonThisQuarter = analytics.wonThisQuarter,
            wonThisYear = analytics.wonThisYear,
            lostThisMonth = analytics.lostThisMonth,
            lostThisQuarter = analytics.lostThisQuarter,
            lostThisYear = analytics.lostThisYear,
            createdThisMonth = analytics.createdThisMonth,
            createdThisQuarter = analytics.createdThisQuarter,
            createdThisYear = analytics.createdThisYear,
            // Previous period
            wonLastMonth = analytics.wonLastMonth,
            wonLastQuarter = analytics.wonLastQuarter,
            wonLastYear = analytics.wonLastYear,
            lostLastMonth = analytics.lostLastMonth,
            lostLastQuarter = analytics.lostLastQuarter,
            lostLastYear = analytics.lostLastYear,
            createdLastMonth = analytics.createdLastMonth,
            createdLastQuarter = analytics.createdLastQuarter,
            createdLastYear = analytics.createdLastYear,
            // Metrics
            conversionRate = analytics.conversionRate,
            averageDaysToClose = analytics.averageDaysToClose,
            activitiesByStage = analytics.activitiesByStage.map { (stage, count) ->
                StageCount(
                    stage = SalesStageModel.valueOf(stage.name),
                    count = count
                )
            },
            consultantStats = analytics.consultantStats.map { stat ->
                ConsultantActivityStats(
                    consultant = salesPipelineMapper.userMapper.toUserModel(stat.consultant),
                    activeActivities = stat.activeActivities,
                    wonTotal = stat.wonTotal,
                    lostTotal = stat.lostTotal
                )
            },
            customerStats = analytics.customerStats.map { stat ->
                CustomerActivityStats(
                    customerName = stat.customerName,
                    activeActivities = stat.activeActivities,
                    wonTotal = stat.wonTotal,
                    lostTotal = stat.lostTotal
                )
            },
            closedReasonStats = analytics.closedReasonStats.map { (reason, count) ->
                ClosedReasonCount(
                    reason = ClosedReasonModel.valueOf(reason.name),
                    count = count
                )
            },
            availabilityStats = AvailabilityStats(
                totalConsultants = analytics.availabilityStats.totalConsultants,
                available = analytics.availabilityStats.available,
                availableSoon = analytics.availabilityStats.availableSoon,
                assigned = analytics.availabilityStats.assigned,
                occupied = analytics.availabilityStats.occupied
            ),
            funnelData = analytics.funnelData.map { stage ->
                FunnelStageData(
                    stage = stage.stage,
                    reached = stage.reached,
                    current = stage.current
                )
            },
            funnelTotalJobPostings = analytics.funnelTotalJobPostings,
            funnelTotalCreated = analytics.funnelTotalCreated,
            funnelWonCount = analytics.funnelWonCount,
            funnelLostCount = analytics.funnelLostCount
        )

        return ResponseEntity.ok(response)
    }

    override fun getSalesPipelineTrends(months: Int): ResponseEntity<List<MonthlyTrendData>> {
        val trendsData = salesPipelineService.getMonthlyTrends(months)

        val response = trendsData.map { trend ->
            MonthlyTrendData(
                month = trend.month,
                created = trend.created,
                won = trend.won,
                lost = trend.lost,
                benchWeeks = trend.benchWeeks
            )
        }

        return ResponseEntity.ok(response)
    }

    // ==================== Evaluation Analytics ====================

    override fun getEvaluationAnalytics(months: Int?): ResponseEntity<EvaluationAnalytics> {
        val data = salesPipelineService.getEvaluationAnalytics(months)

        val response = EvaluationAnalytics(
            closedReasonBreakdown = data.closedReasonBreakdown.map { (reason, count) ->
                ClosedReasonCount(
                    reason = ClosedReasonModel.valueOf(reason.name),
                    count = count
                )
            },
            closedReasonByStage = data.closedReasonByStage.map { (stage, reasons) ->
                ClosedReasonByStage(
                    stage = stage.name,
                    count = reasons.values.sum(),
                    reasons = reasons.map { (reason, count) ->
                        ClosedReasonCount(
                            reason = ClosedReasonModel.valueOf(reason.name),
                            count = count
                        )
                    }
                )
            },
            avgMatchRatingWon = data.avgMatchRatingWon,
            avgMatchRatingLost = data.avgMatchRatingLost,
            matchRatingDistribution = data.matchRatingDistribution.map { bucket ->
                MatchRatingBucket(
                    rating = bucket.rating,
                    wonCount = bucket.wonCount,
                    lostCount = bucket.lostCount
                )
            },
            customerExperienceEffect = CustomerExperienceEffect(
                withExperienceWon = data.customerExperienceEffect.withExperienceWon,
                withExperienceLost = data.customerExperienceEffect.withExperienceLost,
                withoutExperienceWon = data.customerExperienceEffect.withoutExperienceWon,
                withoutExperienceLost = data.customerExperienceEffect.withoutExperienceLost
            ),
            closedActivities = data.closedActivities.map { salesPipelineMapper.toSalesActivityModel(it) }
        )

        return ResponseEntity.ok(response)
    }

    // ==================== Consultant Analytics ====================

    override fun getConsultantAnalytics(): ResponseEntity<List<ConsultantDetailedStats>> {
        val data = salesPipelineService.getConsultantAnalytics()

        val response = data.map { stat ->
            ConsultantDetailedStats(
                consultant = salesPipelineMapper.userMapper.toUserModel(stat.consultant),
                availabilityStatus = stat.availabilityStatus?.let {
                    AvailabilityStatusModel.valueOf(it.name)
                },
                activeActivities = stat.activeActivities,
                wonTotal = stat.wonTotal,
                lostTotal = stat.lostTotal,
                winRate = stat.winRate,
                avgMatchRating = stat.avgMatchRating,
                avgDaysToClose = stat.avgDaysToClose,
                mostCommonLossReason = stat.mostCommonLossReason?.let {
                    ClosedReasonModel.valueOf(it.name)
                },
                activities = stat.activities.map { salesPipelineMapper.toSalesActivityModel(it) }
            )
        }

        return ResponseEntity.ok(response)
    }

    // ==================== Competency Base Analytics ====================

    override fun getCompetencyBaseAnalytics(months: Int?): ResponseEntity<CompetencyBaseAnalytics> {
        val data = salesPipelineService.getCompetencyBaseAnalytics(months)

        val response = CompetencyBaseAnalytics(
            availabilityStats = AvailabilityStats(
                totalConsultants = data.availabilityStats.totalConsultants,
                available = data.availabilityStats.available,
                availableSoon = data.availabilityStats.availableSoon,
                assigned = data.availabilityStats.assigned,
                occupied = data.availabilityStats.occupied
            ),
            upcomingAvailable = data.upcomingAvailable.map { upcoming ->
                UpcomingAvailableConsultant(
                    consultant = salesPipelineMapper.userMapper.toUserModel(upcoming.consultant),
                    availableFrom = upcoming.availableFrom,
                    currentCustomer = upcoming.currentCustomerName
                )
            },
            sectorDistribution = data.sectorDistribution.map { sector ->
                SectorDistribution(
                    sector = no.jpro.mypageapi.model.CustomerSector.valueOf(sector.sector.name),
                    customerCount = sector.customerCount,
                    consultantCount = sector.consultantCount
                )
            },
            techCategoryDistribution = data.techCategoryDistribution.map { tech ->
                TechCategoryCount(
                    techCategory = tech.techCategory,
                    count = tech.count
                )
            },
            skillGap = data.skillGap.map { entry ->
                SkillGapEntry(
                    techCategory = entry.techCategory,
                    demanded = entry.demanded,
                    won = entry.won,
                    hitRate = entry.hitRate
                )
            },
            tagAnalysis = data.tagAnalysis.map { entry ->
                TagGapEntry(
                    tagName = entry.tagName,
                    demanded = entry.demanded,
                    won = entry.won,
                    hitRate = entry.hitRate
                )
            }
        )

        return ResponseEntity.ok(response)
    }

    // ==================== Customer Analytics ====================

    override fun getCustomerAnalytics(months: Int?): ResponseEntity<CustomerAnalytics> {
        val data = salesPipelineService.getCustomerAnalytics(months)

        val response = CustomerAnalytics(
            customers = data.customers.map { customer ->
                CustomerDetailedStats(
                    customerId = customer.customerId,
                    customerName = customer.customerName,
                    sector = customer.sector?.let {
                        no.jpro.mypageapi.model.CustomerSector.valueOf(it.name)
                    },
                    currentConsultantCount = customer.currentConsultantCount,
                    activeActivities = customer.activeActivities,
                    wonTotal = customer.wonTotal,
                    lostTotal = customer.lostTotal,
                    winRate = customer.winRate,
                    mostCommonLossReason = customer.mostCommonLossReason?.let {
                        ClosedReasonModel.valueOf(it.name)
                    }
                )
            },
            sectorComparison = data.sectorComparison.map { sector ->
                SectorDistribution(
                    sector = no.jpro.mypageapi.model.CustomerSector.valueOf(sector.sector.name),
                    customerCount = sector.customerCount,
                    consultantCount = sector.consultantCount
                )
            },
            supplierStats = data.supplierStats.map { supplier ->
                SupplierStats(
                    supplierName = supplier.supplierName,
                    totalActivities = supplier.totalActivities,
                    wonTotal = supplier.wonTotal,
                    lostTotal = supplier.lostTotal,
                    winRate = supplier.winRate
                )
            },
            sourceStats = data.sourceStats.map { source ->
                SourceStats(
                    source = source.source,
                    totalJobPostings = source.totalJobPostings,
                    wonActivities = source.wonActivities,
                    lostActivities = source.lostActivities,
                    winRate = source.winRate
                )
            }
        )

        return ResponseEntity.ok(response)
    }

    // ==================== Bench Analytics ====================

    override fun getBenchAnalytics(months: Int): ResponseEntity<BenchAnalytics> {
        val data = salesPipelineService.getBenchAnalytics(months)

        val response = BenchAnalytics(
            currentBenchDuration = data.currentBenchDuration.map { entry ->
                CurrentBenchConsultant(
                    consultant = salesPipelineMapper.userMapper.toUserModel(entry.consultant),
                    daysOnBench = entry.daysOnBench,
                    becameAvailableAt = entry.becameAvailableAt.atOffset(java.time.ZoneOffset.UTC)
                )
            },
            involuntaryBenchTrend = data.involuntaryBenchTrend.map { entry ->
                MonthlyInvoluntaryBench(
                    month = entry.month,
                    totalBenchWeeks = entry.totalBenchWeeks,
                    isCalculated = entry.isCalculated
                )
            },
            yearlyBenchSummary = data.yearlyBenchSummary.map { entry ->
                YearlyBenchSummary(
                    year = entry.year,
                    totalBenchWeeks = entry.totalBenchWeeks,
                    totalAvailableWeeks = entry.totalAvailableWeeks,
                    benchPercentage = entry.benchPercentage
                )
            }
        )

        return ResponseEntity.ok(response)
    }
}
