package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.entity.ConsultantAvailability
import no.jpro.mypageapi.entity.InterviewRound
import no.jpro.mypageapi.entity.SalesActivity
import no.jpro.mypageapi.entity.SalesStage
import no.jpro.mypageapi.entity.SalesStageHistory
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.ConsultantAvailability as ConsultantAvailabilityModel
import no.jpro.mypageapi.model.InterviewRound as InterviewRoundModel
import no.jpro.mypageapi.model.SalesActivity as SalesActivityModel
import no.jpro.mypageapi.model.SalesActivityWithHistory as SalesActivityWithHistoryModel
import no.jpro.mypageapi.model.SalesStageHistoryEntry as SalesStageHistoryEntryModel
import no.jpro.mypageapi.model.Customer as CustomerModel
import no.jpro.mypageapi.model.AvailabilityStatus as AvailabilityStatusModel
import no.jpro.mypageapi.model.ActivityStatus as ActivityStatusModel
import no.jpro.mypageapi.model.ClosedReason as ClosedReasonModel
import no.jpro.mypageapi.model.SalesStage as SalesStageModel
import no.jpro.mypageapi.model.CustomerSector as CustomerSectorModel
import no.jpro.mypageapi.model.KeyFactor as KeyFactorModel
import no.jpro.mypageapi.model.ConsultantWithActivities as ConsultantWithActivitiesModel
import java.time.OffsetDateTime
import java.time.ZoneId

@Service
class SalesPipelineMapper(
    val userMapper: UserMapper
) {
    companion object {
        // Use explicit timezone to ensure consistent behavior across environments
        val OSLO_ZONE: ZoneId = ZoneId.of("Europe/Oslo")
    }

    private fun toOffsetDateTime(localDateTime: java.time.LocalDateTime): OffsetDateTime =
        localDateTime.atZone(OSLO_ZONE).toOffsetDateTime()

    private data class SubmissionInfo(val submittedAt: OffsetDateTime, val isSupplier: Boolean)

    private fun getSubmissionInfo(entity: SalesActivity): SubmissionInfo? {
        val firstSubmission = entity.stageHistory
            .filter { it.toStage == SalesStage.SENT_TO_SUPPLIER || it.toStage == SalesStage.SENT_TO_CUSTOMER }
            .minByOrNull { it.changedAt }
            ?: return null
        return SubmissionInfo(toOffsetDateTime(firstSubmission.changedAt), firstSubmission.toStage == SalesStage.SENT_TO_SUPPLIER)
    }

    fun toCustomerModel(customer: no.jpro.mypageapi.entity.Customer): CustomerModel = CustomerModel(
        id = customer.id,
        name = customer.name,
        exclusive = customer.exclusive,
        sector = CustomerSectorModel.valueOf(customer.sector.name)
    )

    fun toConsultantAvailabilityModel(entity: ConsultantAvailability): ConsultantAvailabilityModel =
        ConsultantAvailabilityModel(
            id = entity.id,
            consultant = userMapper.toUserModel(entity.consultant),
            status = AvailabilityStatusModel.valueOf(entity.status.name),
            availableFrom = entity.availableFrom,
            currentCustomer = entity.currentCustomer?.let { toCustomerModel(it) },
            notes = entity.notes,
            updatedAt = toOffsetDateTime(entity.updatedAt),
            updatedBy = entity.updatedBy?.let { userMapper.toUserModel(it) },
            displayOrder = entity.displayOrder
        )

    fun toSalesStageHistoryEntryModel(entity: SalesStageHistory): SalesStageHistoryEntryModel =
        SalesStageHistoryEntryModel(
            id = entity.id,
            fromStage = entity.fromStage?.let { SalesStageModel.valueOf(it.name) },
            toStage = SalesStageModel.valueOf(entity.toStage.name),
            changedAt = toOffsetDateTime(entity.changedAt),
            changedBy = entity.changedBy?.let { userMapper.toUserModel(it) },
            daysInPreviousStage = entity.daysInPreviousStage
        )

    fun toInterviewRoundModel(entity: InterviewRound): InterviewRoundModel =
        InterviewRoundModel(
            id = entity.id,
            roundNumber = entity.roundNumber,
            interviewDate = entity.interviewDate?.let { toOffsetDateTime(it) },
            notes = entity.notes,
            createdAt = toOffsetDateTime(entity.createdAt)
        )

    fun toSalesActivityModel(entity: SalesActivity): SalesActivityModel {
        val submission = getSubmissionInfo(entity)
        return SalesActivityModel(
            id = entity.id,
            consultant = userMapper.toUserModel(entity.consultant),
            customer = entity.customer?.let { toCustomerModel(it) },
            customerName = entity.customerName,
            supplierName = entity.supplierName,
            title = entity.title,
            currentStage = SalesStageModel.valueOf(entity.currentStage.name),
            status = ActivityStatusModel.valueOf(entity.status.name),
            closedReason = entity.closedReason?.let { ClosedReasonModel.valueOf(it.name) },
            closedReasonNote = entity.closedReasonNote,
            notes = entity.notes,
            maxPrice = entity.maxPrice,
            offeredPrice = entity.offeredPrice,
            createdAt = toOffsetDateTime(entity.createdAt),
            updatedAt = toOffsetDateTime(entity.updatedAt),
            createdBy = entity.createdBy?.let { userMapper.toUserModel(it) },
            closedAt = entity.closedAt?.let { toOffsetDateTime(it) },
            expectedStartDate = entity.expectedStartDate,
            offerDeadline = entity.offerDeadline?.let { toOffsetDateTime(it) },
            offerDeadlineAsap = entity.offerDeadlineAsap,
            interviewDate = entity.interviewDate?.let { toOffsetDateTime(it) },
            interviewRounds = entity.interviewRounds.sortedBy { it.roundNumber }.map { toInterviewRoundModel(it) },
            actualStartDate = entity.actualStartDate,
            submittedAt = submission?.submittedAt,
            submittedTo = submission?.let {
                if (it.isSupplier) SalesActivityModel.SubmittedTo.SUPPLIER else SalesActivityModel.SubmittedTo.CUSTOMER
            },
            matchRating = entity.matchRating,
            evaluationNotes = entity.evaluationNotes,
            evaluationDocumentUrl = entity.evaluationDocumentUrl,
            keyFactors = entity.keyFactors?.split(",")?.filter { it.isNotBlank() }?.mapNotNull {
                try { KeyFactorModel.valueOf(it.trim()) } catch (_: IllegalArgumentException) { null }
            },
            jobPostingId = entity.jobPosting?.id
        )
    }

    fun toSalesActivityWithHistoryModel(entity: SalesActivity): SalesActivityWithHistoryModel {
        val submission = getSubmissionInfo(entity)
        return SalesActivityWithHistoryModel(
            id = entity.id,
            consultant = userMapper.toUserModel(entity.consultant),
            customer = entity.customer?.let { toCustomerModel(it) },
            customerName = entity.customerName,
            supplierName = entity.supplierName,
            title = entity.title,
            currentStage = SalesStageModel.valueOf(entity.currentStage.name),
            status = ActivityStatusModel.valueOf(entity.status.name),
            closedReason = entity.closedReason?.let { ClosedReasonModel.valueOf(it.name) },
            closedReasonNote = entity.closedReasonNote,
            notes = entity.notes,
            maxPrice = entity.maxPrice,
            offeredPrice = entity.offeredPrice,
            createdAt = toOffsetDateTime(entity.createdAt),
            updatedAt = toOffsetDateTime(entity.updatedAt),
            createdBy = entity.createdBy?.let { userMapper.toUserModel(it) },
            closedAt = entity.closedAt?.let { toOffsetDateTime(it) },
            expectedStartDate = entity.expectedStartDate,
            offerDeadline = entity.offerDeadline?.let { toOffsetDateTime(it) },
            offerDeadlineAsap = entity.offerDeadlineAsap,
            interviewDate = entity.interviewDate?.let { toOffsetDateTime(it) },
            interviewRounds = entity.interviewRounds.sortedBy { it.roundNumber }.map { toInterviewRoundModel(it) },
            actualStartDate = entity.actualStartDate,
            submittedAt = submission?.submittedAt,
            submittedTo = submission?.let {
                if (it.isSupplier) SalesActivityWithHistoryModel.SubmittedTo.SUPPLIER else SalesActivityWithHistoryModel.SubmittedTo.CUSTOMER
            },
            matchRating = entity.matchRating,
            evaluationNotes = entity.evaluationNotes,
            evaluationDocumentUrl = entity.evaluationDocumentUrl,
            keyFactors = entity.keyFactors?.split(",")?.filter { it.isNotBlank() }?.mapNotNull {
                try { KeyFactorModel.valueOf(it.trim()) } catch (_: IllegalArgumentException) { null }
            },
            jobPostingId = entity.jobPosting?.id,
            stageHistory = entity.stageHistory.map { toSalesStageHistoryEntryModel(it) }
        )
    }

    fun toConsultantWithActivitiesModel(
        consultant: no.jpro.mypageapi.entity.User,
        activities: List<SalesActivity>,
        availability: ConsultantAvailability?
    ): ConsultantWithActivitiesModel = ConsultantWithActivitiesModel(
        consultant = userMapper.toUserModel(consultant),
        activities = activities.map { toSalesActivityModel(it) },
        availability = availability?.let { toConsultantAvailabilityModel(it) }
    )
}
