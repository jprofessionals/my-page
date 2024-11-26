'use client'

import {
  createContext,
  MutableRefObject,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Settings, User } from '@/types'
import ApiService from '@/services/api.service'
import config from '../config/config'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

type UserFetchStatus =
  | 'init'
  | 'fetchingUser'
  | 'fetched'
  | 'fetchFailed'
  | 'signedOut'

type AuthContextType = {
  isAuthenticated: boolean
  userToken: string | null
  authenticate: (divElement: MutableRefObject<HTMLDivElement | null>) => void
  userFetchStatus: UserFetchStatus
  user: User | null
  logout: () => void
  setUser: (user: User | null) => void
  settings: Settings[] | undefined
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [userFetchStatus, setUserFetchStatus] =
    useState<UserFetchStatus>('init')

  useEffect(() => {
    const token = sessionStorage.getItem('user_token')
    setUserToken(token)
    setIsLoading(false)
  }, [])

  const isAuthenticated = !!userToken

  useEffect(() => {
    const getUser = async () => {
      setUserFetchStatus('fetchingUser')
      try {
        const user = await ApiService.getUser()
        setUser({
          ...user.data,
          loaded: true,
        })
        setUserFetchStatus('fetched')
      } catch (e) {
        if (axios.isAxiosError(e) && e.response) {
          const headerAuthToken = e.response.headers['www-authenticate'] || ''
          if (
            typeof headerAuthToken === 'string' &&
            headerAuthToken.includes('invalid_token')
          ) {
            sessionStorage.removeItem('user_token')
            setUserToken(null)
          }
        }
        setUserFetchStatus('fetchFailed')
      }
    }
    if (isAuthenticated && !user) {
      getUser()
    }
  }, [isAuthenticated, user])

  const router = useRouter()
  const logout = () => {
    sessionStorage.removeItem('user_token')
    setUserFetchStatus('signedOut')
    setUserToken(null)
    setUser(null)
    router.push('/loggut')
  }

  const authenticate = (
    divElement: MutableRefObject<HTMLDivElement | null>,
  ) => {
    if (isAuthenticated) return

    if (typeof window !== 'undefined' && window.google) {
      const { googleClientId } = config()

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        auto_select: true,
        prompt_parent_id: 'signInDiv',
        use_fedcm_for_prompt: true,
        callback: (response) => {
          sessionStorage.setItem('user_token', response.credential)
          setUserToken(response.credential)
        },
      })

      window.google.accounts.id.prompt(() => {
        const signInDiv = divElement.current
        if (signInDiv)
          window.google.accounts.id.renderButton(signInDiv, {
            type: 'standard',
            theme: 'outline',
            size: 'medium',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          })
      })
    }
  }

  const { data: settings } = useQuery({
    queryKey: ['settingsQueryKey'],

    queryFn: () => {
      return ApiService.getSettings()
    },
  })

  return (
    <AuthContext.Provider
      value={{
        userToken,
        isAuthenticated,
        user,
        setUser,
        authenticate,
        userFetchStatus,
        logout,
        settings,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error("Can't use useAuthContext outside of AuthProvider.")
  }
  return auth
}
