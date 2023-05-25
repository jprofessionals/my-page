import Admin from '@/components/admin/Admin'
import dynamic from 'next/dynamic'

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function admin() {
  return (
    <RequireAuth>
      <Admin />
    </RequireAuth>
  )
}
