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
          <div className="text-center max-w-md">
            <h2 className="text-xl mb-4">🧪 Development Mode</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium mb-2">
                Test som bruker:
              </label>
              <select
                className="w-full p-2 border rounded"
                value={localStorage.getItem('testUserId') || '1'}
                onChange={(e) => {
                  localStorage.setItem('testUserId', e.target.value)
                  window.location.reload()
                }}
              >
                <option value="1">Steinar Hansen (Admin)</option>
                <option value="2">Ola Nordmann</option>
                <option value="3">Kari Hansen</option>
                <option value="4">Per Olsen</option>
                <option value="5">Anne Johansen</option>
              </select>
              <p className="text-xs text-gray-600 mt-2">
                Velg en test-bruker for å teste uten Google-pålogging.
                Fungerer kun i lokal utviklingsmodus.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="mb-2">Eller logg inn med Google:</p>
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
