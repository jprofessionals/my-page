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
import ApiService, { API_URL } from '@/services/api.service'
import { useQuery, useQueryClient } from "react-query";
import axios from "axios";
import authHeader from "@/services/auth-header";

type UserFetchStatus = 'init' | 'fetchingUser' | 'fetched' | 'fetchFailed'

type AuthContext = {
  isAuthenticated: boolean
  userToken: string | null
  authenticate: () => void
  userFetchStatus: UserFetchStatus
  user?: User
  logout: () => void
}

const Context = createContext<AuthContext | null>(null)

const getUser = async (): Promise<User> => {
  const response = await axios.get(API_URL + 'me', { headers: authHeader() })
  return response.data
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [userToken, setUserToken] = useState<string | null>(null)
  const [userFetchStatus, setUserFetchStatus] = useState<UserFetchStatus>('init')
  const isAuthenticated = useMemo(() => !!userToken, [userToken])
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    setUserToken(null)
    localStorage.removeItem('user_token')
    queryClient.clear()
  }, [])

  const { data: user } = useQuery("user", async () => {
    setUserFetchStatus('fetchingUser')
    return await getUser()
  }, {
    enabled: isAuthenticated,
    onSuccess: () => setUserFetchStatus('fetched'),
    onError: () => setUserFetchStatus('fetchFailed'),
  })
  const authHandler = useCallback(async (response: CredentialResponse) => {
    if (response.credential) {
      setUserToken(response.credential)
      localStorage.setItem('user_token', response.credential)
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
        authenticate,
        userFetchStatus,
        logout
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
