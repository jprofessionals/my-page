/**
 * Sales Pipeline Service
 *
 * Uses OpenAPI-generated SDK (type-safe)
 */

import {
  getSalesActivities,
  createSalesActivity,
  getSalesActivity,
  updateSalesActivity,
  deleteSalesActivity,
  updateSalesActivityStage,
  markSalesActivityWon,
  closeSalesActivity,
  getSalesActivitiesByConsultant,
  getSalesActivitiesByCustomer,
  getSalesPipelineBoard,
  getSalesPipelineAnalytics,
  getSalesPipelineTrends,
  getAllConsultantAvailability,
  getConsultantAvailability,
  updateConsultantAvailability,
  getFlowcaseConsultants,
  removeConsultantFromPipeline,
  reorderConsultants,
  addConsultantToBoard,
} from '@/data/types/sdk.gen'
import {
  type CreateSalesActivity,
  type UpdateSalesActivity,
  type UpdateStage,
  type CloseActivity,
  type UpdateConsultantAvailability,
  type AddConsultantToBoardRequest,
  type MarkActivityWonRequest,
  type ActivityStatus,
} from '@/data/types/types.gen'
import '@/services/openapi-client' // Ensure client is configured

export const salesPipelineService = {
  // ===== SALES ACTIVITIES =====

  /**
   * Get all sales activities (optionally filtered by status)
   */
  async getActivities(status?: ActivityStatus) {
    const { data } = await getSalesActivities({
      query: status ? { status } : undefined,
    })
    return data
  },

  /**
   * Get a single sales activity with full history
   */
  async getActivity(id: number) {
    const { data } = await getSalesActivity({
      path: { id },
    })
    return data
  },

  /**
   * Create a new sales activity
   */
  async createActivity(activity: CreateSalesActivity) {
    const { data } = await createSalesActivity({
      body: activity,
    })
    return data
  },

  /**
   * Update an existing sales activity
   */
  async updateActivity(id: number, updates: UpdateSalesActivity) {
    const { data } = await updateSalesActivity({
      path: { id },
      body: updates,
    })
    return data
  },

  /**
   * Delete a sales activity
   */
  async deleteActivity(id: number) {
    await deleteSalesActivity({
      path: { id },
    })
  },

  /**
   * Update the stage of a sales activity (moves it in the pipeline)
   */
  async updateStage(id: number, stage: UpdateStage) {
    const { data } = await updateSalesActivityStage({
      path: { id },
      body: stage,
    })
    return data
  },

  /**
   * Mark a sales activity as won
   * This will auto-close other active activities for the same consultant
   * @param actualStartDate - Optional start date. If in future, sets status to ASSIGNED until that date.
   */
  async markAsWon(id: number, request?: MarkActivityWonRequest) {
    const { data } = await markSalesActivityWon({
      path: { id },
      body: request,
    })
    return data
  },

  /**
   * Close a sales activity with a reason
   */
  async closeActivity(id: number, closeData: CloseActivity) {
    const { data } = await closeSalesActivity({
      path: { id },
      body: closeData,
    })
    return data
  },

  /**
   * Get all sales activities for a specific consultant
   */
  async getActivitiesByConsultant(userId: number, includeInactive = false) {
    const { data } = await getSalesActivitiesByConsultant({
      path: { userId },
      query: { includeInactive },
    })
    return data
  },

  /**
   * Get all sales activities for a specific customer
   */
  async getActivitiesByCustomer(customerId: number, includeInactive = false) {
    const { data } = await getSalesActivitiesByCustomer({
      path: { customerId },
      query: { includeInactive },
    })
    return data
  },

  // ===== PIPELINE BOARD =====

  /**
   * Get the full pipeline board with all consultants, their activities, and availability
   */
  async getBoard() {
    const { data } = await getSalesPipelineBoard()
    return data
  },

  /**
   * Get analytics data for the sales pipeline
   */
  async getAnalytics() {
    const { data } = await getSalesPipelineAnalytics()
    return data
  },

  /**
   * Get monthly trend data for the sales pipeline
   * @param months - Number of months to return (default 12)
   */
  async getTrends(months = 12) {
    const { data } = await getSalesPipelineTrends({
      query: { months },
    })
    return data
  },

  // ===== CONSULTANT AVAILABILITY =====

  /**
   * Get availability status for all consultants
   */
  async getAllAvailability() {
    const { data } = await getAllConsultantAvailability()
    return data
  },

  /**
   * Get availability status for a specific consultant
   */
  async getAvailability(userId: number) {
    const { data } = await getConsultantAvailability({
      path: { userId },
    })
    return data
  },

  /**
   * Update availability status for a consultant
   */
  async updateAvailability(userId: number, availability: UpdateConsultantAvailability) {
    const { data } = await updateConsultantAvailability({
      path: { userId },
      body: availability,
    })
    return data
  },

  /**
   * Remove a consultant from the sales pipeline entirely.
   * Deletes all their sales activities and availability info.
   */
  async removeConsultantFromPipeline(userId: number) {
    await removeConsultantFromPipeline({
      path: { userId },
    })
  },

  /**
   * Add a consultant to the board without a sales activity.
   * Creates an availability record for the consultant.
   */
  async addConsultantToBoard(request: AddConsultantToBoardRequest) {
    const { data } = await addConsultantToBoard({
      body: request,
    })
    return data
  },

  /**
   * Reorder consultants on the sales pipeline board
   * @param consultantIds - List of consultant IDs in the desired display order
   */
  async reorderConsultants(consultantIds: number[]) {
    await reorderConsultants({
      body: { consultantIds },
    })
  },

  // ===== FLOWCASE CONSULTANTS =====

  /**
   * Get all consultants from Flowcase (optionally filtered by search query)
   */
  async getFlowcaseConsultants(query?: string) {
    const { data } = await getFlowcaseConsultants({
      query: query ? { query } : undefined,
    })
    return data
  },
}

// Re-export types for convenience
export type {
  SalesActivityReadable as SalesActivity,
  SalesActivityWithHistoryReadable as SalesActivityWithHistory,
  SalesStageHistoryEntryReadable as SalesStageHistoryEntry,
  SalesPipelineBoardReadable as SalesPipelineBoard,
  SalesPipelineAnalyticsReadable as SalesPipelineAnalytics,
  ConsultantWithActivitiesReadable as ConsultantWithActivities,
  ConsultantAvailabilityReadable as ConsultantAvailability,
  ConsultantActivityStatsReadable as ConsultantActivityStats,
  CustomerActivityStats,
  StageCount,
  ClosedReasonCount,
  AvailabilityStats,
  FlowcaseConsultant,
  MonthlyTrendData,
  SalesStage,
  ActivityStatus,
  AvailabilityStatus,
  ClosedReason,
  CreateSalesActivity,
  UpdateSalesActivity,
  UpdateStage,
  CloseActivity,
  UpdateConsultantAvailability,
  AddConsultantToBoardRequest,
  MarkActivityWonRequest,
} from '@/data/types/types.gen'
