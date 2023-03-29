import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { User } from '@/types'
import { useLocalStorage, useSessionStorage } from 'usehooks-ts'
import { toast } from 'react-toastify'
import { CredentialResponse } from 'google-one-tap'
import ApiService from '@/services/api.service'

type AuthContext = {
  isAuthenticated: boolean
  authenticate: () => void
  user: User | null
  setUser: (user: User | null) => void
}

const Context = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const isAuthenticated = useMemo(() => !!user, [user])

  const authHandler = useCallback((response: CredentialResponse) => {
    if (response.credential) {
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
  }, [])

  const authenticate = useCallback(() => {
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      auto_select: true,
      prompt_parent_id: 'signInDiv',
      callback: authHandler,
    })

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const signInDiv = document.getElementById('signInDiv')
        if (signInDiv)
          window.google.accounts.id.renderButton(signInDiv, {
            type: 'standard',
            theme: 'outline',
            size: 'medium',
            text: 'continue_with',
            shape: 'rectangular',
          })
      }
    })
  }, [authHandler])

  return (
    <Context.Provider
      value={{
        isAuthenticated,
        user,
        setUser,
        authenticate,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useAuthContext() {
  const auth = useContext(Context)
  if (!auth) {
    throw new Error("Can't use useContext outside of AuthProvider.")
  }
  return auth
}
