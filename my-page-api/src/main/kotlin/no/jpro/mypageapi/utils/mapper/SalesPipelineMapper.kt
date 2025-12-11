package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.entity.ConsultantAvailability
import no.jpro.mypageapi.entity.SalesActivity
import no.jpro.mypageapi.entity.SalesStageHistory
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.ConsultantAvailability as ConsultantAvailabilityModel
import no.jpro.mypageapi.model.SalesActivity as SalesActivityModel
import no.jpro.mypageapi.model.SalesActivityWithHistory as SalesActivityWithHistoryModel
import no.jpro.mypageapi.model.SalesStageHistoryEntry as SalesStageHistoryEntryModel
import no.jpro.mypageapi.model.Customer as CustomerModel
import no.jpro.mypageapi.model.AvailabilityStatus as AvailabilityStatusModel
import no.jpro.mypageapi.model.ActivityStatus as ActivityStatusModel
import no.jpro.mypageapi.model.ClosedReason as ClosedReasonModel
import no.jpro.mypageapi.model.SalesStage as SalesStageModel
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

    fun toCustomerModel(customer: no.jpro.mypageapi.entity.Customer): CustomerModel = CustomerModel(
        id = customer.id,
        name = customer.name,
        exclusive = customer.exclusive
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

    fun toSalesActivityModel(entity: SalesActivity): SalesActivityModel =
        SalesActivityModel(
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
            interviewDate = entity.interviewDate?.let { toOffsetDateTime(it) }
        )

    fun toSalesActivityWithHistoryModel(entity: SalesActivity): SalesActivityWithHistoryModel =
        SalesActivityWithHistoryModel(
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
            stageHistory = entity.stageHistory.map { toSalesStageHistoryEntryModel(it) }
        )

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
