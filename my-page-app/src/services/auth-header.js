export default function authHeader() {
  const headers = {}

  const user_token = sessionStorage.getItem('user_token')
  if (user_token) {
    headers.Authorization = 'Bearer ' + user_token
  }

  // Add test user header for local development
  const testUserId = localStorage.getItem('testUserId')
  if (testUserId) {
    headers['X-Test-User-Id'] = testUserId
  }

  return headers
}
