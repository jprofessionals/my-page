import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DrawTab from '../DrawTab'
import type { DrawingStatus } from '@/types/cabinLottery.types'

describe('DrawTab', () => {
  describe('Conditional Rendering', () => {
    it('should show "must be locked" message when status is not LOCKED', () => {
      render(
        <DrawTab
          drawingStatus="DRAFT"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      expect(
        screen.getByText('Trekningen må være låst før den kan kjøres'),
      ).toBeInTheDocument()
    })

    it('should show draw form when status is LOCKED', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      expect(screen.getByText('Kjør trekning')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('La stå tom for tilfeldig trekning'),
      ).toBeInTheDocument()
    })

    it('should not show form when status is OPEN', () => {
      render(
        <DrawTab
          drawingStatus="OPEN"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      expect(screen.queryByText('Kjør trekning nå')).not.toBeInTheDocument()
    })
  })

  describe('Seed Input', () => {
    it('should display empty seed input field', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      const input = screen.getByPlaceholderText(
        'La stå tom for tilfeldig trekning',
      )
      // Number inputs return null when empty
      expect(input).toHaveValue(null)
    })

    it('should display seed value if provided', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed="42"
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      const input = screen.getByPlaceholderText(
        'La stå tom for tilfeldig trekning',
      )
      // Number inputs convert string values to numbers
      expect(input).toHaveValue(42)
    })

    it('should call onSetDrawSeed when seed value changes', async () => {
      const user = userEvent.setup()
      const mockSetSeed = vi.fn()

      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={mockSetSeed}
          onPerformDraw={vi.fn()}
        />,
      )

      const input = screen.getByPlaceholderText(
        'La stå tom for tilfeldig trekning',
      )
      await user.type(input, '123')

      expect(mockSetSeed).toHaveBeenCalled()
    })

    it('should show help text about seed', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      expect(screen.getByText(/Ikke nødvendig å fylle ut/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Seed brukes kun for å reprodusere/i),
      ).toBeInTheDocument()
    })
  })

  describe('Draw Button', () => {
    it('should show "Kjør trekning nå" when not drawing', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      expect(screen.getByText('Kjør trekning nå')).toBeInTheDocument()
    })

    it('should show "Kjører trekning..." when drawing is in progress', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={true}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      expect(screen.getByText('Kjører trekning...')).toBeInTheDocument()
    })

    it('should be disabled when drawing is in progress', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={true}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      const button = screen.getByRole('button', { name: /Kjører trekning/i })
      expect(button).toBeDisabled()
    })

    it('should be enabled when not drawing', () => {
      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={vi.fn()}
        />,
      )

      const button = screen.getByRole('button', { name: /Kjør trekning nå/i })
      expect(button).not.toBeDisabled()
    })

    it('should call onPerformDraw when button is clicked', async () => {
      const user = userEvent.setup()
      const mockPerformDraw = vi.fn()

      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={mockPerformDraw}
        />,
      )

      const button = screen.getByRole('button', { name: /Kjør trekning nå/i })
      await user.click(button)

      expect(mockPerformDraw).toHaveBeenCalledTimes(1)
    })

    it('should not call onPerformDraw when button is disabled', async () => {
      const user = userEvent.setup()
      const mockPerformDraw = vi.fn()

      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={true}
          onSetDrawSeed={vi.fn()}
          onPerformDraw={mockPerformDraw}
        />,
      )

      const button = screen.getByRole('button', { name: /Kjører trekning/i })
      await user.click(button)

      expect(mockPerformDraw).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle all drawing statuses correctly', () => {
      const statuses: DrawingStatus[] = [
        'DRAFT',
        'OPEN',
        'LOCKED',
        'DRAWN',
        'PUBLISHED',
      ]

      statuses.forEach((status) => {
        const { unmount } = render(
          <DrawTab
            drawingStatus={status}
            drawSeed=""
            isDrawing={false}
            onSetDrawSeed={vi.fn()}
            onPerformDraw={vi.fn()}
          />,
        )

        if (status === 'LOCKED' || status === 'DRAWN') {
          expect(screen.getByText('Kjør trekning nå')).toBeInTheDocument()
        } else if (status === 'PUBLISHED') {
          expect(
            screen.getByText(
              'Kan ikke kjøre ny trekning når den allerede er publisert',
            ),
          ).toBeInTheDocument()
        } else {
          expect(
            screen.getByText('Trekningen må være låst før den kan kjøres'),
          ).toBeInTheDocument()
        }

        unmount()
      })
    })

    it('should accept numeric seed values', async () => {
      const user = userEvent.setup()
      const mockSetSeed = vi.fn()

      render(
        <DrawTab
          drawingStatus="LOCKED"
          drawSeed=""
          isDrawing={false}
          onSetDrawSeed={mockSetSeed}
          onPerformDraw={vi.fn()}
        />,
      )

      const input = screen.getByPlaceholderText(
        'La stå tom for tilfeldig trekning',
      ) as HTMLInputElement
      await user.type(input, '999')

      expect(mockSetSeed).toHaveBeenCalled()
    })
  })
})
