export default function authHeader() {
  const headers = {}

  // In development mode with test user, skip Authorization header
  if (process.env.NODE_ENV === 'development') {
    const testUserId = localStorage.getItem('testUserId')
    if (testUserId) {
      headers['X-Test-User-Id'] = testUserId
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
