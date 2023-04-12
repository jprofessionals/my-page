import { useAuthContext } from '@/providers/AuthProvider'
import { PropsWithChildren } from 'react'

function RequireAdmin({ children }: PropsWithChildren) {
  const { user } = useAuthContext()
  if (user?.admin) {
    return <>{children}</>
  } else {
    return null
  }
}

export default RequireAdmin
