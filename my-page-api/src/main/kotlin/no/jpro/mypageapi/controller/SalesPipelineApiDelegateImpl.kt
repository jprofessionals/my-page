package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.SalesPipelineApiDelegate
import no.jpro.mypageapi.entity.ActivityStatus
import no.jpro.mypageapi.entity.ClosedReason
import no.jpro.mypageapi.entity.SalesStage
import no.jpro.mypageapi.model.CloseActivity
import no.jpro.mypageapi.model.ConsultantWithActivities
import no.jpro.mypageapi.model.CreateSalesActivity
import no.jpro.mypageapi.model.FlowcaseConsultant
import no.jpro.mypageapi.model.SalesPipelineBoard
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
            createdBy = currentUser
        )

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(salesPipelineMapper.toSalesActivityModel(activity))
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

    override fun markSalesActivityWon(id: Long): ResponseEntity<SalesActivityModel> {
        val currentUser = authHelper.getCurrentUser(getTestUserId())
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        if (!currentUser.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        try {
            val activity = salesPipelineService.markActivityWon(id, currentUser)
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
            val activity = salesPipelineService.closeActivity(id, reason, closeActivity.note, currentUser)
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
        }

        // All stages
        val stages = SalesStage.entries.map { SalesStageModel.valueOf(it.name) }

        val board = SalesPipelineBoard(
            consultants = consultantsWithActivities,
            stages = stages
        )

        return ResponseEntity.ok(board)
    }
}
