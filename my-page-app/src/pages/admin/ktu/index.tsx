// pages/admin/ktu/index.tsx
import dynamic from 'next/dynamic'
import KtuAdminDashboard from '@/components/ktu/admin/KtuAdminDashboard'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

const RequireAdmin = dynamic(() => import('@/utils/RequireAdmin'), {
  ssr: false,
})

export default function AdminKtu() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <KtuAdminDashboard />
      </RequireAdmin>
    </RequireAuth>
  )
}
