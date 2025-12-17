// pages/kti/index.tsx
import dynamic from 'next/dynamic'
import ConsultantKtiDashboard from '@/components/kti/consultant/ConsultantKtiDashboard'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function KtiPage() {
  return (
    <RequireAuth>
      <ConsultantKtiDashboard />
    </RequireAuth>
  )
}
