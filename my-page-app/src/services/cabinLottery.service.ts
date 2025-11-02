/**
 * Cabin Lottery Service
 *
 * Uses OpenAPI-generated SDK (type-safe)
 */

import {
  getCurrentDrawing,
  getDrawing,
  getDrawingPeriods,
  submitWishes,
  getMyWishes,
  getMyAllocations,
  getDrawingAllocations,
  getLotteryApartments,
  createAdminDrawing,
  getAllDrawings,
  getAdminDrawing,
  deleteDrawing,
  createPeriod,
  getAdminPeriods,
  updatePeriod,
  deletePeriod,
  bulkCreatePeriods,
  lockDrawing,
  unlockDrawing,
  openDrawing,
  revertToDraft,
  revertToLocked,
  performDrawing,
  publishDrawing,
  getAllWishes,
  getAdminAllocations,
  importWishes,
  deleteExecution,
  type CreateCabinWish,
  type CreatePeriod as CreatePeriodType,
} from '@/data/types/sdk.gen'
import '@/services/openapi-client' // Ensure client is configured

// ===== USER ENDPOINTS (OpenAPI SDK) =====

export const cabinLotteryService = {
  /**
   * Get current active drawing
   */
  async getCurrentDrawing() {
    const { data } = await getCurrentDrawing()
    return data
  },

  /**
   * Get drawing by ID
   */
  async getDrawing(drawingId: string) {
    const { data } = await getDrawing({
      path: { drawingId },
    })
    return data
  },

  /**
   * Get all periods for a drawing
   */
  async getPeriods(drawingId: string) {
    const { data } = await getDrawingPeriods({
      path: { drawingId },
    })
    return data
  },

  /**
   * Submit wishes for a drawing
   */
  async submitWishes(drawingId: string, wishes: CreateCabinWish[]) {
    const { data } = await submitWishes({
      path: { drawingId },
      body: { wishes },
    })
    return data
  },

  /**
   * Get my wishes for a drawing
   */
  async getMyWishes(drawingId: string) {
    const { data } = await getMyWishes({
      path: { drawingId },
    })
    return data
  },

  /**
   * Get my allocations for a drawing
   */
  async getMyAllocations(drawingId: string) {
    const { data } = await getMyAllocations({
      path: { drawingId },
    })
    return data
  },

  /**
   * Get all allocations for a drawing
   */
  async getAllAllocations(drawingId: string, executionId?: string) {
    const { data } = await getDrawingAllocations({
      path: { drawingId },
      query: executionId ? { executionId } : undefined,
    })
    return data
  },

  /**
   * Get all available apartments
   */
  async getApartments() {
    const { data } = await getLotteryApartments()
    return data
  },
}

// ===== ADMIN ENDPOINTS (OpenAPI SDK) =====

export const adminCreateDrawing = async (season: string) => {
  const { data } = await createAdminDrawing({
    body: { season },
  })
  return { data }
}

export const adminGetAllDrawings = async () => {
  const { data } = await getAllDrawings()
  return { data }
}

export const adminGetDrawing = async (drawingId: string) => {
  const { data } = await getAdminDrawing({
    path: { drawingId },
  })
  return { data }
}

export const adminDeleteDrawing = async (drawingId: string) => {
  const { data } = await deleteDrawing({
    path: { drawingId },
  })
  return { data }
}

export const adminAddPeriod = async (drawingId: string, period: CreatePeriodType) => {
  const { data } = await createPeriod({
    path: { drawingId },
    body: period,
  })
  return { data }
}

export const adminGetPeriods = async (drawingId: string) => {
  const { data } = await getAdminPeriods({
    path: { drawingId },
  })
  return { data }
}

export const adminUpdatePeriod = async (drawingId: string, periodId: string, period: CreatePeriodType) => {
  const { data } = await updatePeriod({
    path: { drawingId, periodId },
    body: period,
  })
  return { data }
}

export const adminDeletePeriod = async (drawingId: string, periodId: string) => {
  const { data } = await deletePeriod({
    path: { drawingId, periodId },
  })
  return { data }
}

export const adminBulkCreatePeriods = async (drawingId: string, startDate: string, endDate: string) => {
  const { data } = await bulkCreatePeriods({
    path: { drawingId },
    body: { startDate, endDate },
  })
  return { data }
}

export const adminLockDrawing = async (drawingId: string) => {
  const { data } = await lockDrawing({
    path: { drawingId },
  })
  return { data }
}

export const adminUnlockDrawing = async (drawingId: string) => {
  const { data } = await unlockDrawing({
    path: { drawingId },
  })
  return { data }
}

export const adminOpenDrawing = async (drawingId: string) => {
  const { data } = await openDrawing({
    path: { drawingId },
  })
  return { data }
}

export const adminRevertToDraft = async (drawingId: string) => {
  const { data } = await revertToDraft({
    path: { drawingId },
  })
  return { data }
}

export const adminRevertToLocked = async (drawingId: string) => {
  const { data } = await revertToLocked({
    path: { drawingId },
  })
  return { data }
}

export const adminPerformDraw = async (drawingId: string, seed: number | null = null) => {
  const { data } = await performDrawing({
    path: { drawingId },
    query: seed !== null ? { seed } : undefined,
  })
  return { data }
}

export const adminPublishDrawing = async (drawingId: string, executionId: string) => {
  const { data } = await publishDrawing({
    path: { drawingId },
    query: { executionId },
  })
  return { data }
}

export const adminGetAllWishes = async (drawingId: string) => {
  const { data } = await getAllWishes({
    path: { drawingId },
  })
  return { data }
}

export const adminGetAllocations = async (drawingId: string, executionId: string | null = null) => {
  const { data } = await getAdminAllocations({
    path: { drawingId },
    query: executionId ? { executionId } : undefined,
  })
  return { data }
}

export const adminImportWishes = async (drawingId: string, file: File) => {
  const { data } = await importWishes({
    path: { drawingId },
    body: { file },
  })
  return { data }
}

export const adminDeleteExecution = async (drawingId: string, executionId: string) => {
  const { data } = await deleteExecution({
    path: { drawingId, executionId },
  })
  return { data }
}

// For backwards compatibility with axios-style responses
export default {
  getCurrentDrawing: () => cabinLotteryService.getCurrentDrawing().then((data) => ({ data })),
  getDrawing: (drawingId: string) => cabinLotteryService.getDrawing(drawingId).then((data) => ({ data })),
  getPeriods: (drawingId: string) => cabinLotteryService.getPeriods(drawingId).then((data) => ({ data })),
  submitWishes: (drawingId: string, wishes: CreateCabinWish[]) =>
    cabinLotteryService.submitWishes(drawingId, wishes).then((data) => ({ data })),
  getMyWishes: (drawingId: string) => cabinLotteryService.getMyWishes(drawingId).then((data) => ({ data })),
  getMyAllocations: (drawingId: string) =>
    cabinLotteryService.getMyAllocations(drawingId).then((data) => ({ data })),
  getAllAllocations: (drawingId: string, executionId?: string) =>
    cabinLotteryService.getAllAllocations(drawingId, executionId).then((data) => ({ data })),
  getApartments: () => cabinLotteryService.getApartments().then((data) => ({ data })),
  adminCreateDrawing,
  adminGetAllDrawings,
  adminGetDrawing,
  adminDeleteDrawing,
  adminAddPeriod,
  adminGetPeriods,
  adminUpdatePeriod,
  adminDeletePeriod,
  adminBulkCreatePeriods,
  adminLockDrawing,
  adminUnlockDrawing,
  adminOpenDrawing,
  adminRevertToDraft,
  adminRevertToLocked,
  adminPerformDraw,
  adminPublishDrawing,
  adminGetAllWishes,
  adminGetAllocations,
  adminImportWishes,
  adminDeleteExecution,
}