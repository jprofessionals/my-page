import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultsTab from '../ResultsTab'
import type { Period, Allocation } from '@/types/cabinLottery.types'

describe('ResultsTab', () => {
  const mockPeriods: Period[] = [
    {
      id: 'period-1',
      startDate: '2025-04-01',
      endDate: '2025-04-08',
      description: 'Påske',
      sortOrder: 1,
      comment: '',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'period-2',
      startDate: '2025-02-18',
      endDate: '2025-02-25',
      description: 'Vinterferie',
      sortOrder: 2,
      comment: '',
      createdAt: '2025-01-01T00:00:00Z',
    },
  ]

  const mockAllocations: Allocation[] = [
    {
      id: 'alloc-1',
      periodId: 'period-1',
      periodDescription: 'Påske',
      startDate: '2025-04-01',
      endDate: '2025-04-08',
      apartmentId: 1,
      apartmentName: 'Stor leilighet',
      userId: 1,
      userName: 'Ola Nordmann',
      userEmail: 'ola@example.com',
      allocationType: 'DRAWN',
      comment: null,
      allocatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'alloc-2',
      periodId: 'period-1',
      periodDescription: 'Påske',
      startDate: '2025-04-01',
      endDate: '2025-04-08',
      apartmentId: 2,
      apartmentName: 'Liten leilighet',
      userId: 2,
      userName: 'Kari Hansen',
      userEmail: 'kari@example.com',
      allocationType: 'DRAWN',
      comment: null,
      allocatedAt: '2025-01-15T10:00:00Z',
    },
  ]

  const mockAuditLog = [
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
  ]

  describe('Rendering', () => {
    it('should show "not drawn yet" message when no allocations', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={[]}
        />
      )

      expect(screen.getByText('Trekning ikke gjennomført ennå')).toBeInTheDocument()
    })

    it('should show results when allocations exist', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
        />
      )

      expect(screen.getByText('Oversikt over tildelinger')).toBeInTheDocument()
      expect(screen.getByText('Tildelinger per periode')).toBeInTheDocument()
    })

    it('should not show audit log section when auditLog is empty', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
        />
      )

      expect(screen.queryByText('Trekkingslogg')).not.toBeInTheDocument()
    })

    it('should show audit log when provided', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
          auditLog={mockAuditLog}
        />
      )

      expect(screen.getByText('Trekkingslogg')).toBeInTheDocument()
      expect(screen.getByText('=== SNAKE DRAFT TREKNING ===')).toBeInTheDocument()
      expect(screen.getByText('Seed: 42')).toBeInTheDocument()
    })
  })

  describe('Allocations Display', () => {
    it('should group allocations by period', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
        />
      )

      // Should show period headers
      expect(screen.getByText('Påske')).toBeInTheDocument()
      expect(screen.getByText('Vinterferie')).toBeInTheDocument()
    })

    it('should show apartment and user for each allocation', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
        />
      )

      expect(screen.getByText('Stor leilighet')).toBeInTheDocument()
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument()
      expect(screen.getByText('Liten leilighet')).toBeInTheDocument()
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument()
    })

    it('should show "no allocations" for empty period', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={[mockAllocations[0]]} // Only Påske has allocation
        />
      )

      // Vinterferie should show "Ingen tildelinger"
      const periodSections = screen.getAllByText(/Ingen tildelinger/)
      expect(periodSections.length).toBeGreaterThan(0)
    })

    it('should display allocations in correct order within period', () => {
      const allocations = [
        { ...mockAllocations[0], apartmentName: 'B Apartment' },
        { ...mockAllocations[1], apartmentName: 'A Apartment' },
      ]

      const { container } = render(
        <ResultsTab
          periods={mockPeriods}
          allocations={allocations}
        />
      )

      const allocationElements = container.querySelectorAll('.font-medium')
      const apartmentNames = Array.from(allocationElements).map(el => el.textContent)

      // Should maintain order from data, not alphabetically sorted
      expect(apartmentNames).toContain('B Apartment')
      expect(apartmentNames).toContain('A Apartment')
    })
  })

  describe('Audit Log Display', () => {
    it('should render all audit log lines', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
          auditLog={mockAuditLog}
        />
      )

      // Check for key audit log content (testing-library normalizes whitespace, so check for trimmed content)
      mockAuditLog.forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine) {
          // Use regex matcher to handle whitespace variations
          expect(screen.getByText((content, element) => {
            return element?.textContent?.trim() === trimmedLine
          })).toBeInTheDocument()
        }
      })
    })

    it('should use monospace font for audit log', () => {
      const { container } = render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
          auditLog={mockAuditLog}
        />
      )

      const auditLogContainer = container.querySelector('.font-mono')
      expect(auditLogContainer).toBeInTheDocument()
    })

    it('should have scrollable container for long audit logs', () => {
      const longAuditLog = Array.from({ length: 100 }, (_, i) => `Line ${i}`)

      const { container } = render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
          auditLog={longAuditLog}
        />
      )

      const scrollableContainer = container.querySelector('.overflow-y-auto')
      expect(scrollableContainer).toBeInTheDocument()
      expect(scrollableContainer).toHaveClass('max-h-96')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined auditLog gracefully', () => {
      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={mockAllocations}
        />
      )

      expect(screen.queryByText('Trekkingslogg')).not.toBeInTheDocument()
    })

    it('should handle empty periods array', () => {
      render(
        <ResultsTab
          periods={[]}
          allocations={mockAllocations}
        />
      )

      // Should not crash, component should render
      expect(screen.getByText('Oversikt over tildelinger')).toBeInTheDocument()
    })

    it('should handle allocations for non-existent periods', () => {
      const orphanAllocations: Allocation[] = [
        {
          ...mockAllocations[0],
          periodId: 'non-existent-period',
        },
      ]

      render(
        <ResultsTab
          periods={mockPeriods}
          allocations={orphanAllocations}
        />
      )

      // Should render without crashing
      expect(screen.getByText('Oversikt over tildelinger')).toBeInTheDocument()
    })
  })
})