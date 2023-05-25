import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as _ from 'radash'
import { User } from '@/types'
import ApiService from '@/services/api.service'
import config from '../config/config'
import { useSessionStorage } from 'usehooks-ts'

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
  const [userToken, setUserToken] = useSessionStorage<string | null>(
    'user_token',
    null,
  )

  const [userFetchStatus, setUserFetchStatus] =
    useState<UserFetchStatus>('init')
  const isAuthenticated = useMemo(() => !!userToken, [userToken])

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
        const headerAuthToken = _.get(
          e,
          'response.headers.[www-authenticate]',
          '',
        ) // Then the token was either expired or otherwise invalid
        if (headerAuthToken?.includes('invalid_token')) {
          setUserToken(null)
        }
        setUserFetchStatus('fetchFailed')
      }
    }
    if (isAuthenticated && !user) {
      getUser()
    }
  }, [isAuthenticated, setUserToken, user])

  const authenticate = async () => {
    const { googleClientId } = config()

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      auto_select: true,
      prompt_parent_id: 'signInDiv',
      callback: (response) => setUserToken(response.credential),
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
  }

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
