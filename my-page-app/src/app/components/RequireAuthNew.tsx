'use client'

import React, { useMemo, useRef } from 'react'
import { CredentialResponse } from 'google-one-tap'
import Script from 'next/script'
import config from '@/config/config'
import { useSessionStorage } from 'usehooks-ts'

export default function RequireAuthNew({
  children,
}: {
  children: React.ReactNode
}) {
  const signInDivRef = useRef(null)
  const [userToken, setUserToken] = useSessionStorage<string | null>(
    'user_token',
    null,
    { initializeWithValue: false },
  )
  const isAuthenticated = useMemo(() => !!userToken, [userToken])

  const handleCallbackResponse = (response: CredentialResponse) => {
    setUserToken(response.credential)
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <>
      <div id="signInDiv" ref={signInDivRef}></div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: config().googleClientId,
              auto_select: true,
              prompt_parent_id: 'signInDiv',
              use_fedcm_for_prompt: true,
              callback: handleCallbackResponse,
            })

            window.google.accounts.id.prompt(() => {
              const signInDiv = signInDivRef.current
              if (signInDiv) {
                window.google.accounts.id.renderButton(signInDiv, {
                  type: 'standard',
                  theme: 'outline',
                  size: 'medium',
                  text: 'continue_with',
                  shape: 'rectangular',
                  logo_alignment: 'left',
                })
              }
            })
          }
        }}
      />
    </>
  )
}
