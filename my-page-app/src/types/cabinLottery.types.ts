// Type definitions for Cabin Lottery feature
// Re-export OpenAPI generated types

import type {
  CabinDrawing,
  CabinPeriod,
  CabinWish,
  CabinAllocation,
  CabinDrawingExecution,
  Apartment as ApartmentType,
  CreateCabinWish,
  BulkCreateWishes,
} from '@/data/types/types.gen'

// Re-export with simpler names
export type Drawing = CabinDrawing
export type Period = CabinPeriod
export type Wish = CabinWish
export type Allocation = CabinAllocation
export type Execution = CabinDrawingExecution
export type Apartment = ApartmentType
export type { CreateCabinWish, BulkCreateWishes }

// Drawing statuses (kept for backwards compatibility)
export type DrawingStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'DRAWN' | 'PUBLISHED'

// Form states
export interface PeriodFormState {
  startDate: string
  endDate: string
  description: string
  comment: string
  sortOrder: number
}

export interface BulkPeriodFormState {
  startDate: string
  endDate: string
}

export interface WishFormState {
  periodId: string
  priority: number
  apartmentIds: number[]
  comment: string
}

// API responses
export interface DrawResult {
  allocations: Allocation[]
  statistics: {
    totalParticipants: number
    totalAllocations: number
    participantsWithZeroAllocations: number
    participantsWithOneAllocation: number
    participantsWithTwoAllocations: number
  }
}

export interface ImportResult {
  totalLines: number
  successCount: number
  errorCount: number
  errors?: Array<{
    line: number
    message: string
  }>
}

// View modes
export type WishesViewMode = 'by-user' | 'by-period'
export type ActiveTab = 'periods' | 'wishes' | 'draw' | 'results' | 'executions'

// Grouped data structures
export interface WishesByUser {
  [userId: number]: Wish[]
}

export interface WishesByPeriod {
  [periodId: string]: Wish[]
}

export interface AllocationsByUser {
  [userId: number]: Allocation[]
}

export interface AllocationsByPeriod {
  [periodId: string]: Allocation[]
}
