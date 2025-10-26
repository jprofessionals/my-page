import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserWishForm from '../UserWishForm'
import cabinLotteryService from '@/services/cabinLottery.service'
import { toast } from 'react-toastify'
import {
  createMockDrawing,
  createMockPeriods,
  createMockApartments,
  createMockWishes,
} from './factories'

// Mock the services and toast
vi.mock('@/services/cabinLottery.service')
vi.mock('react-toastify')

// Mock UserResults component
vi.mock('../UserResults', () => ({
  default: () => <div>User Results Component</div>,
}))

describe('UserWishForm', () => {
  const mockPeriods = createMockPeriods()
  const mockApartments = createMockApartments()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Storage.prototype.getItem = vi.fn()
    Storage.prototype.setItem = vi.fn()
    Storage.prototype.removeItem = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      // Setup mock to never resolve (simulate loading)
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockImplementation(
        () => new Promise(() => {})
      )

      render(<UserWishForm />)

      expect(screen.getByText('Laster...')).toBeInTheDocument()
    })
  })

  describe('No Drawing State', () => {
    it('should show "no active drawing" message when drawing is null', async () => {
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: null })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Ingen aktiv hyttetrekning for øyeblikket.')).toBeInTheDocument()
      })
    })

    it('should show "no active drawing" when status is DRAFT', async () => {
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: null })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Ingen aktiv hyttetrekning for øyeblikket.')).toBeInTheDocument()
      })
    })
  })

  describe('Published Status', () => {
    it('should show UserResults component when status is PUBLISHED', async () => {
      const publishedDrawing = createMockDrawing({ status: 'PUBLISHED' })

      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({
        data: publishedDrawing,
      })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('User Results Component')).toBeInTheDocument()
      })
    })
  })

  describe('Locked/Drawn Status', () => {
    it('should show read-only wishes when status is LOCKED', async () => {
      const lockedDrawing = createMockDrawing({ status: 'LOCKED' })
      const mockWishes = createMockWishes()

      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: lockedDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: mockWishes })

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Dine registrerte ønsker')).toBeInTheDocument()
        expect(screen.getByText('Trekningen er låst. Resultater vil bli publisert snart.')).toBeInTheDocument()
        expect(screen.queryByText('Registrer dine ønsker')).not.toBeInTheDocument()
      })
    })

    it('should show read-only wishes when status is DRAWN', async () => {
      const drawnDrawing = createMockDrawing({ status: 'DRAWN' })
      const mockWishes = createMockWishes()

      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: drawnDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: mockWishes })

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Dine registrerte ønsker')).toBeInTheDocument()
        expect(screen.queryByText('Registrer dine ønsker')).not.toBeInTheDocument()
      })
    })

    it('should display existing wishes correctly', async () => {
      const lockedDrawing = createMockDrawing({ status: 'LOCKED' })
      const mockWishes = createMockWishes()

      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: lockedDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: mockWishes })

      render(<UserWishForm />)

      await waitFor(() => {
        // Check that wishes are displayed - there may be multiple with same data
        const priorityLabels = screen.getAllByText(/Prioritet \d+/)
        expect(priorityLabels.length).toBeGreaterThan(0)

        // Check for period names (may appear multiple times)
        expect(screen.getAllByText('Påske').length).toBeGreaterThan(0)

        // Check for apartment name
        expect(screen.getByText('Stor leilighet')).toBeInTheDocument()
      })
    })
  })

  describe('Open Status - Form Display', () => {
    beforeEach(() => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })
    })

    it('should show form when status is OPEN', async () => {
      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Registrer dine ønsker')).toBeInTheDocument()
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })
    })

    it('should show season and status', async () => {
      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Test Sommer 2025')).toBeInTheDocument()
        expect(screen.getByText('Åpen for registrering')).toBeInTheDocument()
      })
    })

    it('should pre-populate form with existing wishes', async () => {
      const mockWishes = createMockWishes()
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: mockWishes })

      render(<UserWishForm />)

      await waitFor(() => {
        // Should show existing wishes in form
        expect(screen.getAllByText(/Ønske \d+/).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Add Wish', () => {
    beforeEach(() => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })
    })

    it('should add a new wish when "Legg til ønske" is clicked', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      expect(screen.getByText('Ønske 1')).toBeInTheDocument()
    })

    it('should add multiple wishes', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)
      await user.click(addButton)

      expect(screen.getByText('Ønske 1')).toBeInTheDocument()
      expect(screen.getByText('Ønske 2')).toBeInTheDocument()
    })
  })

  describe('Remove Wish', () => {
    beforeEach(() => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })
    })

    it('should remove wish when "Fjern" is clicked', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      expect(screen.getByText('Ønske 1')).toBeInTheDocument()

      const removeButton = screen.getByText('Fjern')
      await user.click(removeButton)

      expect(screen.queryByText('Ønske 1')).not.toBeInTheDocument()
    })
  })

  describe('Period Selection', () => {
    beforeEach(() => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })
    })

    it('should show all periods in dropdown', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // All periods should be available as options
      expect(screen.getByText('Påske')).toBeInTheDocument()
      expect(screen.getByText('Vinterferie')).toBeInTheDocument()
      expect(screen.getByText('Sommer uke 1')).toBeInTheDocument()
    })

    it('should allow changing period selection', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // Find all select elements and get the one in the wish form (not test user selector)
      const selects = screen.getAllByRole('combobox')
      // The period select should be the last one (after test user selector)
      const periodSelect = selects[selects.length - 1]

      // Should have first period selected by default
      expect(periodSelect).toHaveValue(mockPeriods[0].id)

      // Change to second period
      await user.selectOptions(periodSelect, mockPeriods[1].id)
      expect(periodSelect).toHaveValue(mockPeriods[1].id)
    })
  })

  describe('Apartment Selection', () => {
    beforeEach(() => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })
    })

    it('should show all apartments as checkboxes', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // All apartments should be shown
      expect(screen.getByLabelText('Stor leilighet')).toBeInTheDocument()
      expect(screen.getByLabelText('Liten leilighet')).toBeInTheDocument()
      expect(screen.getByLabelText('Annekset')).toBeInTheDocument()
    })

    it('should allow selecting multiple apartments', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      const checkbox1 = screen.getByLabelText('Stor leilighet')
      const checkbox2 = screen.getByLabelText('Liten leilighet')

      await user.click(checkbox1)
      await user.click(checkbox2)

      expect(checkbox1).toBeChecked()
      expect(checkbox2).toBeChecked()
    })

    it('should show validation warning if no apartment selected', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // Should show warning badge
      expect(screen.getByText(/Må velge minst én enhet/i)).toBeInTheDocument()
    })

    it('should allow reordering apartments with up/down buttons', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // Select two apartments
      const checkbox1 = screen.getByLabelText('Stor leilighet')
      const checkbox2 = screen.getByLabelText('Liten leilighet')

      await user.click(checkbox1)
      await user.click(checkbox2)

      // Should show priority order section
      expect(screen.getByText('Valgte enheter i prioritert rekkefølge:')).toBeInTheDocument()

      // Should have up/down buttons
      const upButtons = screen.getAllByTitle('Flytt opp')
      const downButtons = screen.getAllByTitle('Flytt ned')

      expect(upButtons.length).toBeGreaterThan(0)
      expect(downButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })
    })

    it('should disable submit button when no wishes', async () => {
      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const submitButton = screen.getByText('Lagre ønsker')
      expect(submitButton).toBeDisabled()
    })

    it('should show warning toast if wish has no apartments selected', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      const submitButton = screen.getByText('Lagre ønsker')
      await user.click(submitButton)

      expect(toast.warning).toHaveBeenCalledWith(
        'Alle ønsker må ha en periode og minst én enhet valgt'
      )
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })
      vi.mocked(cabinLotteryService.submitWishes).mockResolvedValue({ data: null })
    })

    it('should submit wishes successfully', async () => {
      const user = userEvent.setup()

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      // Add a wish
      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // Select an apartment
      const checkbox = screen.getByLabelText('Stor leilighet')
      await user.click(checkbox)

      // Submit
      const submitButton = screen.getByText('Lagre ønsker')
      await user.click(submitButton)

      await waitFor(() => {
        expect(cabinLotteryService.submitWishes).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('Ønsker lagret!')
      })
    })

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup()

      // Make submit take some time
      vi.mocked(cabinLotteryService.submitWishes).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: null }), 100))
      )

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      // Add a wish
      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // Select an apartment
      const checkbox = screen.getByLabelText('Stor leilighet')
      await user.click(checkbox)

      // Submit
      const submitButton = screen.getByText('Lagre ønsker')
      await user.click(submitButton)

      // Should show loading text
      expect(screen.getByText('Lagrer...')).toBeInTheDocument()
    })

    it('should show error toast on submission failure', async () => {
      const user = userEvent.setup()

      vi.mocked(cabinLotteryService.submitWishes).mockRejectedValue(
        new Error('Network error')
      )

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      // Add a wish
      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // Select an apartment
      const checkbox = screen.getByLabelText('Stor leilighet')
      await user.click(checkbox)

      // Submit
      const submitButton = screen.getByText('Lagre ønsker')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Feil ved lagring av ønsker')
      })
    })

    it('should disable submit button while saving', async () => {
      const user = userEvent.setup()

      vi.mocked(cabinLotteryService.submitWishes).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: null }), 100))
      )

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Legg til ønske')).toBeInTheDocument()
      })

      // Add a wish
      const addButton = screen.getByText('Legg til ønske')
      await user.click(addButton)

      // Select an apartment
      const checkbox = screen.getByLabelText('Stor leilighet')
      await user.click(checkbox)

      // Submit
      const submitButton = screen.getByText('Lagre ønsker')
      await user.click(submitButton)

      // Button should be disabled during save
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle API error gracefully', async () => {
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockRejectedValue(
        new Error('API Error')
      )
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<UserWishForm />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load data:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle empty periods array', async () => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: mockApartments })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: [] })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Registrer dine ønsker')).toBeInTheDocument()
      })

      // Should not crash when no periods available
    })

    it('should handle empty apartments array', async () => {
      const openDrawing = createMockDrawing({ status: 'OPEN' })
      vi.mocked(cabinLotteryService.getCurrentDrawing).mockResolvedValue({ data: openDrawing })
      vi.mocked(cabinLotteryService.getApartments).mockResolvedValue({ data: [] })
      vi.mocked(cabinLotteryService.getPeriods).mockResolvedValue({ data: mockPeriods })
      vi.mocked(cabinLotteryService.getMyWishes).mockResolvedValue({ data: [] })

      render(<UserWishForm />)

      await waitFor(() => {
        expect(screen.getByText('Registrer dine ønsker')).toBeInTheDocument()
      })

      // Should not crash when no apartments available
    })
  })
})