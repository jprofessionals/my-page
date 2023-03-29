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
          onLoad={() => {
            console.log('Er inne i onLoad')
            authenticate()
          }}
        />
        <div id="signInDiv"></div>
      </>
    )
  } else {
    return <>{children}</>
  }
}

export default RequireAuth
