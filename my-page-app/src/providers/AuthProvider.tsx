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
import { configureOpenAPIClient } from '@/services/openapi-client'

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

  // Configure OpenAPI client on mount (client-side only)
  useEffect(() => {
    configureOpenAPIClient()
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('user_token')

    // Check for test user (works in any environment if testUserId is set)
    const testUserId = localStorage.getItem('testUserId')

    if (testUserId) {
      // If testUserId is set, use test mode
      setUserToken('test-user-token')
      setIsLoading(false)
      return
    }

    // In development without test user, set default test user
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('testUserId', '1')
      setUserToken('test-user-token')
      setIsLoading(false)
      return
    }

    // Production mode - use real token
    setUserToken(token)
    setIsLoading(false)
  }, [])

  const isAuthenticated = !!userToken

  // Track testUserId changes to refetch user when test user changes
  const [testUserId, setTestUserId] = useState<string | null>(null)

  useEffect(() => {
    // Listen for storage changes (when test user changes)
    const handleStorageChange = () => {
      const newTestUserId = localStorage.getItem('testUserId')
      setTestUserId(newTestUserId)
    }

    // Initial value
    handleStorageChange()

    // Listen for changes
    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event when test user changes in same tab
    window.addEventListener('testUserChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('testUserChanged', handleStorageChange)
    }
  }, [])

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
        // If authentication fails, clear the token
        if (e instanceof Error && e.message.includes('401')) {
          sessionStorage.removeItem('user_token')
          setUserToken(null)
        }
        setUserFetchStatus('fetchFailed')
      }
    }
    if (isAuthenticated) {
      // Refetch user when testUserId changes
      getUser()
    }
  }, [isAuthenticated, testUserId])

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
