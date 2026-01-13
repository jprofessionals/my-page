/**
 * OpenAPI Client Configuration
 *
 * Configures the auto-generated OpenAPI client with:
 * - Base URL
 * - Authentication headers (Bearer token, X-Test-User-Id, or X-Test-User-Email)
 * - Request/response interceptors
 * - Global 401 handling for session expiry
 */

import { client } from '@/data/types/client.gen'

// Custom event for session expiry - components can listen to this
export const SESSION_EXPIRED_EVENT = 'sessionExpired'

/**
 * Dispatch session expired event
 * This allows any component to react to authentication failures
 */
export function dispatchSessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }
}

/**
 * Get authentication headers for API requests
 * In development mode with test user, uses X-Test-User-Email or X-Test-User-Id header
 * Otherwise uses Bearer token from localStorage
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}

  // Only access localStorage in browser environment
  if (typeof window === 'undefined') {
    return headers
  }

  // Check for test user first (works in any environment if testUserId is set)
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

  // Add Authorization header for real users
  const userToken = localStorage.getItem('user_token')
  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`
  }

  return headers
}

// Track if we've already dispatched a session expired event to avoid duplicates
let sessionExpiredDispatched = false

/**
 * Reset the session expired flag (called after user logs in again)
 */
export function resetSessionExpiredFlag() {
  sessionExpiredDispatched = false
}

/**
 * Configure the OpenAPI client
 * Call this once when the app starts
 */
export function configureOpenAPIClient() {
  // Only configure in browser environment
  if (typeof window === 'undefined') {
    return
  }

  // Set base URL
  client.setConfig({
    baseUrl: '/api',
  })

  // Set up request interceptor to dynamically add auth headers
  client.interceptors.request.use((request) => {
    const authHeaders = getAuthHeaders()

    // Append auth headers to the existing headers
    Object.entries(authHeaders).forEach(([key, value]) => {
      request.headers.set(key, value)
    })

    return request
  })

  // Set up response interceptor to handle 401 errors globally
  client.interceptors.response.use((response) => {
    if (response.status === 401 && !sessionExpiredDispatched) {
      sessionExpiredDispatched = true

      // Clear the stored token
      localStorage.removeItem('user_token')

      // Dispatch event so AuthProvider can handle it
      dispatchSessionExpired()
    }

    return response
  })
}

// Auto-configure on import (only in browser)
if (typeof window !== 'undefined') {
  configureOpenAPIClient()
}