import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import RequireAdmin from './RequireAdmin'
import { useAuthContext } from '@/providers/AuthProvider'

// Mock the useAuthContext hook
vi.mock('@/providers/AuthProvider', () => ({
  useAuthContext: vi.fn(),
}))

const mockUseAuthContext = useAuthContext as vi.Mock

describe('RequireAdmin', () => {
  it('renders children when the user is an admin', () => {
    mockUseAuthContext.mockReturnValue({
      user: { admin: true },
    })

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>,
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('does not render children when the user is not an admin', () => {
    mockUseAuthContext.mockReturnValue({
      user: { admin: false },
    })

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>,
    )

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('does not render children when there is no user', () => {
    mockUseAuthContext.mockReturnValue({
      user: null,
    })

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>,
    )

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })
})
