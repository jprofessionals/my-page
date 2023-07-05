import Hyttebooking from '@/components/hyttebooking/Hyttebooking'
import dynamic from 'next/dynamic'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function hyttebooking() {
  return (
    <RequireAuth>
      <Hyttebooking />
    </RequireAuth>
  )
}
