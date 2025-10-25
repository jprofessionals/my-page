'use client'

import React, { PropsWithChildren, useRef, useEffect, useState } from 'react'
import Script from 'next/script'
import { useAuthContext } from '@/providers/AuthProvider'
import ErrorPage from '@/components/ErrorPage'

function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated, authenticate, userFetchStatus } = useAuthContext()
  const signInDivRef = useRef<HTMLDivElement | null>(null)
  const [useTestUser, setUseTestUser] = useState(false)

  // In development, check if test user is set
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const testUserId = localStorage.getItem('testUserId')
      setUseTestUser(!!testUserId)
    }
  }, [])

  // Skip authentication in development if test user is set
  if (process.env.NODE_ENV === 'development' && useTestUser) {
    if (userFetchStatus === 'fetched') return <>{children}</>
    if (userFetchStatus === 'fetchingUser') {
      return (
        <p>Henter brukeropplysninger med test-bruker...</p>
      )
    }
    if (userFetchStatus === 'fetchFailed' || userFetchStatus === 'init') {
      return (
        <div className="flex justify-center flex-col items-center gap-4 w-full mt-[30%]">
          <h2 className="text-xl">🧪 Development Mode - Test Bruker</h2>
          <p>Test-bruker er satt i localStorage</p>
          <p>Prøver å hente brukerdata...</p>
        </div>
      )
    }
  }

  if (!isAuthenticated || userFetchStatus === 'signedOut') {
    return (
      <div className="flex justify-center flex-col items-center gap-4 w-full mt-[30%]">
        {process.env.NODE_ENV === 'development' ? (
          <div className="text-center">
            <h2 className="text-xl">🧪 Development Mode</h2>
            <p className="mt-2">Sett test-bruker i console:</p>
            <code className="block bg-gray-100 p-2 mt-2 rounded">
              localStorage.setItem('testUserId', '1')
            </code>
            <p className="mt-2">Deretter oppdater siden</p>
            <div className="mt-4 pt-4 border-t">
              <p>Eller logg inn med Google:</p>
            </div>
          </div>
        ) : (
          <h2 className="text-xl">🖐️ Denne siden krever innlogging</h2>
        )}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
          onReady={() => authenticate(signInDivRef)}
        />
        <div id="signInDiv" ref={signInDivRef}></div>
      </div>
    )
  } else {
    if (userFetchStatus === 'fetched') return <>{children}</>
    if (userFetchStatus === 'fetchingUser') {
      return (
        <p>Autentisering vellykket. Henter flere opplysninger om bruker...</p>
      )
    }
    if (userFetchStatus === 'fetchFailed') {
      return (
        <ErrorPage
          errorText="Klarte ikke å hente brukeropplysninger fra Min sides API. Prøv igjen
            senere."
        />
      )
    }
    return null
  }
}

export default RequireAuth
