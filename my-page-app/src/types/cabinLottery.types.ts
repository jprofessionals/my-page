// Type definitions for Cabin Lottery feature

// Drawing statuses
export type DrawingStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'DRAWN' | 'PUBLISHED'

// Main entities
export interface Drawing {
  id: string
  season: string
  status: DrawingStatus
  createdAt: string
  lockedAt?: string | null
  publishedAt?: string | null
  publishedExecutionId?: string | null
  publishedBy?: number | null
  publishedByName?: string | null
  periods?: Period[]
  executions?: Execution[]
  bookingWarnings?: string[] | null
}

export interface Execution {
  id: string
  drawingId: string
  executedAt: string
  executedBy: number
  executedByName?: string | null
  randomSeed?: number | null
  auditLog?: string[] | null
  allocationCount: number
}

export interface Period {
  id: string
  drawingId: string
  startDate: string
  endDate: string
  description: string
  sortOrder: number
  comment?: string | null
}

export interface Wish {
  id: string
  drawingId: string
  userId: number
  userName: string
  userEmail: string
  periodId: string
  periodDescription: string
  priority: number
  desiredApartmentIds: number[]
  desiredApartmentNames: string[]
  comment?: string | null
}

export interface Allocation {
  id: string
  drawingId: string
  userId: number
  userName: string
  userEmail: string
  periodId: string
  periodDescription: string
  startDate: string
  endDate: string
  apartmentId: number
  apartmentName: string
  apartmentSortOrder?: number
  allocationRound: number
}

export interface Apartment {
  id: number
  cabin_name: string
}

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