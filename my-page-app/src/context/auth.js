import { createContext, useContext, useState } from 'react'
import { User } from '../User'

const Context = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(new User())

  return (
    <Context.Provider
      value={[isAuthenticated, setIsAuthenticated, user, setUser]}
    >
      {children}
    </Context.Provider>
  )
}

export function useAuthContext() {
  return useContext(Context)
}
