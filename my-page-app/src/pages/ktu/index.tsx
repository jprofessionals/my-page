// pages/ktu/index.tsx
import dynamic from 'next/dynamic'
import ConsultantKtuDashboard from '@/components/ktu/consultant/ConsultantKtuDashboard'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function KtuPage() {
  return (
    <RequireAuth>
      <ConsultantKtuDashboard />
    </RequireAuth>
  )
}
