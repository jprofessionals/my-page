import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as _ from 'radash'
import { User, Settings } from '@/types'
import ApiService from '@/services/api.service'
import config from '../config/config'
import { useSessionStorage } from 'usehooks-ts'
import { useRouter } from 'next/router'
import { useQuery } from 'react-query'

type UserFetchStatus =
  | 'init'
  | 'fetchingUser'
  | 'fetched'
  | 'fetchFailed'
  | 'signedOut'

type AuthContext = {
  isAuthenticated: boolean
  userToken: string | null
  authenticate: () => void
  userFetchStatus: UserFetchStatus
  user: User | null
  logout: () => void
  setUser: (user: User | null) => void
  settings: Settings[] | undefined
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

  const router = useRouter()
  const logout = () => {
    setUserFetchStatus('signedOut')
    setUserToken(null)
    setUser(null)
    router.push('/loggut')
  }

  const authenticate = async () => {
    const { googleClientId } = config()

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      auto_select: true,
      prompt_parent_id: 'signInDiv',
      use_fedcm_for_prompt: true,
      callback: (response) => setUserToken(response.credential),
    })

    window.google.accounts.id.prompt((notification) => {
      const signInDiv = document.getElementById('signInDiv')
      if (signInDiv)
        window.google.accounts.id.renderButton(signInDiv, {
          type: 'standard',
          theme: 'outline',
          size: 'medium',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment:'left'
        })
     })
  }

  const { data: settings } = useQuery<Settings[]>('settingsQueryKey', async () => {return await ApiService.getSettings()} )

  return (
    <Context.Provider
      value={{
        userToken,
        isAuthenticated,
        user,
        setUser,
        authenticate,
        userFetchStatus,
        logout,
        settings
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
