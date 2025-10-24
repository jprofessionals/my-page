// pages/admin/hyttetrekning.tsx
import dynamic from 'next/dynamic'
import AdminDashboard from '@/components/hyttetrekning/AdminDashboard'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

const RequireAdmin = dynamic(() => import('@/utils/RequireAdmin'), {
  ssr: false,
})

export default function AdminHyttetrekning() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>
    </RequireAuth>
  )
}
