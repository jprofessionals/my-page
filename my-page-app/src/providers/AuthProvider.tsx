'use client'

import {
  createContext,
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { User } from '@/types'
import { Setting } from '@/data/types/types.gen'
import ApiService from '@/services/api.service'
import config from '../config/config'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  configureOpenAPIClient,
  SESSION_EXPIRED_EVENT,
  resetSessionExpiredFlag,
} from '@/services/openapi-client'

// Decode JWT token to get expiration time (without verifying signature)
function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.exp ? payload.exp * 1000 : null // Convert to milliseconds
  } catch {
    return null
  }
}

// Check if token is expired or will expire soon (within 5 minutes)
function isTokenExpiringSoon(token: string, bufferMs: number = 5 * 60 * 1000): boolean {
  const exp = getTokenExpiration(token)
  if (!exp) return true // If we can't decode, assume expired
  return Date.now() + bufferMs >= exp
}

type UserFetchStatus =
  | 'init'
  | 'fetchingUser'
  | 'fetched'
  | 'fetchFailed'
  | 'signedOut'
  | 'sessionExpired'

type AuthContextType = {
  isAuthenticated: boolean
  userToken: string | null
  authenticate: (divElement: MutableRefObject<HTMLDivElement | null>) => void
  userFetchStatus: UserFetchStatus
  user: User | null
  logout: () => void
  setUser: (user: User | null) => void
  settings: Setting[] | undefined
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const googleInitializedRef = useRef(false)

  const [userFetchStatus, setUserFetchStatus] =
    useState<UserFetchStatus>('init')

  // Configure OpenAPI client on mount (client-side only)
  useEffect(() => {
    configureOpenAPIClient()
  }, [])

  // Function to trigger silent token refresh via Google One Tap
  const triggerTokenRefresh = useCallback(() => {
    if (typeof window === 'undefined' || !window.google) return

    const { googleClientId } = config()

    // Re-initialize Google One Tap to get a fresh token
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      auto_select: true,
      use_fedcm_for_prompt: true,
      callback: (response) => {
        localStorage.setItem('user_token', response.credential)
        setUserToken(response.credential)
        resetSessionExpiredFlag()
        console.log('[Auth] Token refreshed silently')
      },
    })

    // Prompt for silent refresh
    window.google.accounts.id.prompt()
  }, [])

  // Schedule token refresh before expiration
  const scheduleTokenRefresh = useCallback((token: string) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    const exp = getTokenExpiration(token)
    if (!exp) return

    // Schedule refresh 5 minutes before expiration
    const refreshTime = exp - Date.now() - 5 * 60 * 1000
    if (refreshTime <= 0) {
      // Token already expired or expiring very soon, refresh now
      triggerTokenRefresh()
      return
    }

    console.log(`[Auth] Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`)
    refreshTimerRef.current = setTimeout(() => {
      console.log('[Auth] Triggering scheduled token refresh')
      triggerTokenRefresh()
    }, refreshTime)
  }, [triggerTokenRefresh])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  // Listen for session expired events from the API client
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleSessionExpired = () => {
      // Only handle if we think we're authenticated
      if (userToken) {
        setUserToken(null)
        setUser(null)
        setUserFetchStatus('sessionExpired')
      }
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    }
  }, [userToken])

  useEffect(() => {
    // Only access storage in browser environment
    if (typeof window === 'undefined') {
      return
    }

    const token = localStorage.getItem('user_token')

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

    // Production mode - check if token is still valid
    if (token) {
      if (isTokenExpiringSoon(token, 0)) {
        // Token expired, clear it and trigger refresh
        localStorage.removeItem('user_token')
        setUserToken(null)
        console.log('[Auth] Stored token expired, will need to re-authenticate')
      } else {
        // Token still valid, schedule refresh
        setUserToken(token)
        scheduleTokenRefresh(token)
      }
    }
    setIsLoading(false)
  }, [scheduleTokenRefresh])

  const isAuthenticated = !!userToken

  // Track testUserId changes to refetch user when test user changes
  const [testUserId, setTestUserId] = useState<string | null>(null)

  useEffect(() => {
    // Only access storage in browser environment
    if (typeof window === 'undefined') {
      return
    }

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
          employeeNumber: user.data?.employeeNumber?.toString() ?? '',
        } as User)
        setUserFetchStatus('fetched')
      } catch (e) {
        // If authentication fails, clear the token
        if (e instanceof Error && e.message.includes('401')) {
          localStorage.removeItem('user_token')
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
    localStorage.removeItem('user_token')
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
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
          localStorage.setItem('user_token', response.credential)
          setUserToken(response.credential)
          setUserFetchStatus('init') // Reset status so user data is fetched
          resetSessionExpiredFlag() // Allow future 401s to be handled
          scheduleTokenRefresh(response.credential) // Schedule refresh before expiration
        },
      })
      googleInitializedRef.current = true

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
