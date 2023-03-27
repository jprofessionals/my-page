import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { User } from '@/types'

type AuthContext = {
  isAuthenticated: boolean
  setIsAuthenticated: (isAuth: boolean) => void
  user: User | null
  setUser: (user: User) => void
}

const Context = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  return (
    <Context.Provider
      value={{ isAuthenticated, setIsAuthenticated, user, setUser }}
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
