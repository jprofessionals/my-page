interface User {
  [key: string]: any
}

const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  return JSON.parse(userStr)
}

const AuthService = {
  getCurrentUser,
}

export default AuthService