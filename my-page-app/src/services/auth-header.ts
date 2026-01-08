export default function authHeader(): Record<string, string> {
  const headers: Record<string, string> = {}

  // Only access localStorage/sessionStorage in browser environment
  if (typeof window === 'undefined') {
    return headers
  }

  // Check for test user only in development mode
  if (process.env.NODE_ENV === 'development') {
    const testUserId = localStorage.getItem('testUserId')
    if (testUserId) {
      // testUserId can be either a numeric ID (legacy) or an email address
      if (testUserId.includes('@')) {
        headers['X-Test-User-Email'] = testUserId
      } else {
        headers['X-Test-User-Id'] = testUserId
      }
      return headers // Return early, don't add Authorization header
    }
  }

  // Add Authorization header for real users
  const user_token = sessionStorage.getItem('user_token')
  if (user_token) {
    headers.Authorization = 'Bearer ' + user_token
  }

  return headers
}