import { PropsWithChildren } from 'react'
import Script from 'next/script'
import { useAuthContext } from '@/providers/AuthProvider'
import ErrorPage from '@/components/ErrorPage'

function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated, authenticate, userFetchStatus } = useAuthContext()

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center w-full mt-[30%]">
        <Script
          src="https://accounts.google.com/gsi/client"
          onReady={() => authenticate()}
        />
        <div id="signInDiv" />
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
