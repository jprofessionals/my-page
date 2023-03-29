import React, { PropsWithChildren } from 'react'
import Script from 'next/script'
import { useAuthContext } from '@/providers/AuthProvider'

function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated, authenticate } = useAuthContext()

  if (!isAuthenticated) {
    return (
      <>
        <Script
          src="https://accounts.google.com/gsi/client"
          onReady={() => authenticate()}
        />
        <div id="signInDiv"></div>
      </>
    )
  } else {
    return <>{children}</>
  }
}

export default RequireAuth
