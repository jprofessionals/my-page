import React, { useCallback } from 'react'
import ApiService from '../../services/api.service'
import { toast } from 'react-toastify'
import Script from 'next/script'
import { useAuthContext } from '../../providers/AuthProvider'

function RequireAuth({ children }) {
  const { isAuthenticated, setIsAuthenticated, setUser } = useAuthContext()

  const authenticate = () => {
    window?.google?.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      auto_select: true,
      prompt_parent_id: 'signInDiv',
      callback: authHandler,
    })

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        window.google.accounts.id.renderButton(
          document.getElementById('signInDiv'),
          {
            type: 'standard',
            theme: 'outline',
            size: 'medium',
            text: 'continue_with',
            shape: 'rectangular',
          },
        )
      }
    })
  }

  function authHandler(response) {
    if (response.credential) {
      setIsAuthenticated(true)

      localStorage.setItem(
        'user_token',
        JSON.stringify({ id_token: response.credential }),
      )
      ApiService.getUser().then(
        (response) => {
          setUser({
            ...response.data,
            loaded: true,
          })
        },
        () => {
          toast.error('Får ikke lastet inn bruker, prøv igjen senere')
        },
      )
    }
  }

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
    return children
  }
}

export default RequireAuth
