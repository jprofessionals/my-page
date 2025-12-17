// pages/admin/kti/index.tsx
import dynamic from 'next/dynamic'
import KtiAdminDashboard from '@/components/kti/admin/KtiAdminDashboard'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

const RequireAdmin = dynamic(() => import('@/utils/RequireAdmin'), {
  ssr: false,
})

export default function AdminKti() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <KtiAdminDashboard />
      </RequireAdmin>
    </RequireAuth>
  )
}
