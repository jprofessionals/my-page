/**
 * Test data factories for cabin lottery tests
 *
 * These factories create mock data objects for testing.
 * Use them to keep tests DRY and consistent.
 */

import type {
  Drawing,
  Period,
  Wish,
  Allocation,
} from '@/types/cabinLottery.types'

/**
 * Create a mock Drawing object
 */
export const createMockDrawing = (
  overrides: Partial<Drawing> = {},
): Drawing => ({
  id: 'test-drawing-id',
  season: 'Test Sommer 2025',
  status: 'DRAFT',
  createdAt: '2025-01-01T00:00:00Z',
  lockedAt: undefined,
  publishedAt: undefined,
  periods: [],
  ...overrides,
})

/**
 * Create a mock Period object
 */
export const createMockPeriod = (overrides: Partial<Period> = {}): Period => ({
  id: 'test-period-id',
  startDate: '2025-04-01',
  endDate: '2025-04-08',
  description: 'Påske',
  sortOrder: 1,
  comment: '',
  ...overrides,
})

/**
 * Create a mock Apartment object
 */
export const createMockApartment = (overrides = {}) => ({
  id: 1,
  cabin_name: 'Stor leilighet',
  sort_order: 1,
  ...overrides,
})

/**
 * Create a mock Wish object
 */
export const createMockWish = (overrides: Partial<Wish> = {}): Wish => ({
  id: 'test-wish-id',
  userId: 1,
  userName: 'Ola Nordmann',
  userEmail: 'ola@example.com',
  periodId: 'test-period-id',
  periodDescription: 'Påske',
  priority: 1,
  desiredApartmentIds: [1, 2],
  desiredApartmentNames: ['Stor leilighet', 'Liten leilighet'],
  ...overrides,
})

/**
 * Create a mock Allocation object
 */
export const createMockAllocation = (
  overrides: Partial<Allocation> = {},
): Allocation => ({
  id: 'test-allocation-id',
  periodId: 'test-period-id',
  periodDescription: 'Påske',
  startDate: '2025-04-01',
  endDate: '2025-04-08',
  apartmentId: 1,
  apartmentName: 'Stor leilighet',
  userId: 1,
  userName: 'Ola Nordmann',
  userEmail: 'ola@example.com',
  allocationType: 'DRAWN',
  allocatedAt: '2025-01-15T10:00:00Z',
  ...overrides,
})

/**
 * Create multiple mock periods for a typical cabin lottery
 */
export const createMockPeriods = (): Period[] => [
  createMockPeriod({
    id: 'period-1',
    startDate: '2025-04-01',
    endDate: '2025-04-08',
    description: 'Påske',
    sortOrder: 1,
  }),
  createMockPeriod({
    id: 'period-2',
    startDate: '2025-02-18',
    endDate: '2025-02-25',
    description: 'Vinterferie',
    sortOrder: 2,
  }),
  createMockPeriod({
    id: 'period-3',
    startDate: '2025-07-01',
    endDate: '2025-07-08',
    description: 'Sommer uke 1',
    sortOrder: 3,
  }),
]

/**
 * Create multiple mock apartments in correct sort order
 */
export const createMockApartments = () => [
  createMockApartment({
    id: 1,
    cabin_name: 'Stor leilighet',
    sort_order: 1,
  }),
  createMockApartment({
    id: 2,
    cabin_name: 'Liten leilighet',
    sort_order: 2,
  }),
  createMockApartment({
    id: 3,
    cabin_name: 'Annekset',
    sort_order: 3,
  }),
]

/**
 * Create a complete mock drawing with periods and wishes
 */
export const createCompleteDrawing = (): Drawing => {
  const periods = createMockPeriods()

  return createMockDrawing({
    id: 'complete-drawing',
    season: 'Komplett Test 2025',
    status: 'OPEN',
    periods,
  })
}

/**
 * Create mock wishes for testing
 */
export const createMockWishes = (): Wish[] => {
  const periods = createMockPeriods()

  return [
    // User 1: Wants Stor leilighet for Påske (priority 1)
    createMockWish({
      id: 'wish-1',
      userId: 1,
      userName: 'Ola Nordmann',
      userEmail: 'ola@example.com',
      periodId: periods[0].id,
      periodDescription: periods[0].description,
      priority: 1,
      desiredApartmentIds: [1],
      desiredApartmentNames: ['Stor leilighet'],
    }),
    // User 1: Wants Liten leilighet for Vinterferie (priority 2)
    createMockWish({
      id: 'wish-2',
      userId: 1,
      userName: 'Ola Nordmann',
      userEmail: 'ola@example.com',
      periodId: periods[1].id,
      periodDescription: periods[1].description,
      priority: 2,
      desiredApartmentIds: [2],
      desiredApartmentNames: ['Liten leilighet'],
    }),
    // User 2: Wants Annekset for Påske (priority 1)
    createMockWish({
      id: 'wish-3',
      userId: 2,
      userName: 'Kari Hansen',
      userEmail: 'kari@example.com',
      periodId: periods[0].id,
      periodDescription: periods[0].description,
      priority: 1,
      desiredApartmentIds: [3],
      desiredApartmentNames: ['Annekset'],
    }),
  ]
}

/**
 * Create mock allocations after a draw
 */
export const createMockAllocations = (): Allocation[] => {
  const periods = createMockPeriods()

  return [
    createMockAllocation({
      id: 'alloc-1',
      periodId: periods[0].id,
      periodDescription: periods[0].description,
      startDate: periods[0].startDate,
      endDate: periods[0].endDate,
      apartmentId: 1,
      apartmentName: 'Stor leilighet',
      userId: 1,
      userName: 'Ola Nordmann',
      userEmail: 'ola@example.com',
    }),
    createMockAllocation({
      id: 'alloc-2',
      periodId: periods[1].id,
      periodDescription: periods[1].description,
      startDate: periods[1].startDate,
      endDate: periods[1].endDate,
      apartmentId: 2,
      apartmentName: 'Liten leilighet',
      userId: 2,
      userName: 'Kari Hansen',
      userEmail: 'kari@example.com',
    }),
  ]
}

/**
 * Create a mock audit log
 */
export const createMockAuditLog = (): string[] => [
  '=== SNAKE DRAFT TREKNING ===',
  'Trekning: Test Sommer 2025',
  'Tidspunkt: 2025-01-15T10:00:00',
  'Seed: 42',
  'Antall deltakere: 3',
  '',
  'Tilfeldig rekkefølge:',
  '  1. Ola Nordmann (ola@example.com)',
  '  2. Kari Hansen (kari@example.com)',
  '  3. Per Olsen (per@example.com)',
  '',
  'Snake-rekkefølge:',
  '  Runde 1 (nedover): Ola Nordmann → Kari Hansen → Per Olsen',
  '  Runde 2 (oppover): Per Olsen → Kari Hansen → Ola Nordmann',
  '',
  '=== START FORDELING ===',
  '',
  'Tur 1/6 (Runde 1, posisjon 1): Ola Nordmann',
  '  Antall tildelinger så langt: 0',
  '  Evaluerer 2 ønsker i prioritert rekkefølge...',
  '    Prioritet 1: Påske - Stor leilighet',
  '      ✓ TILDELT: Stor leilighet i Påske',
  '',
  '=== TREKNING FULLFØRT ===',
  'Totalt antall tildelinger: 3',
  'Deltakere som fikk 0 tildelinger: 0',
  'Deltakere som fikk 1 tildeling: 2',
  'Deltakere som fikk 2 tildelinger: 1',
]
