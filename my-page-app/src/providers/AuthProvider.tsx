import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { User } from '@/types'
import { CredentialResponse } from 'google-one-tap'
import ApiService from '@/services/api.service'

type UserFetchStatus = 'init' | 'fetchingUser' | 'fetched' | 'fetchFailed'

type AuthContext = {
  isAuthenticated: boolean
  userToken: string | null
  authenticate: () => void
  userFetchStatus: UserFetchStatus
  user: User | null
  setUser: (user: User | null) => void
}

const Context = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [userFetchStatus, setUserFetchStatus] =
    useState<UserFetchStatus>('init')
  const isAuthenticated = useMemo(() => !!userToken, [userToken])

  const authHandler = useCallback(async (response: CredentialResponse) => {
    if (response.credential) {
      setUserToken(response.credential)
      localStorage.setItem('user_token', response.credential)
      setUserFetchStatus('fetchingUser')
      try {
        const user = await ApiService.getUser()
        setUser({
          ...user.data,
          loaded: true,
        })
        setUserFetchStatus('fetched')
      } catch (e) {
        setUserFetchStatus('fetchFailed')
      }
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
        userToken,
        isAuthenticated,
        user,
        setUser,
        authenticate,
        userFetchStatus,
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
