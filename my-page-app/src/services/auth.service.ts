interface User {
  name?: string
  email?: string
  admin?: boolean
  enabled?: boolean
}

const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  return JSON.parse(userStr) as User
}

const AuthService = {
  getCurrentUser,
}

export default AuthService
