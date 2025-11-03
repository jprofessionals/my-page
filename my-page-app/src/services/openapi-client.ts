/**
 * OpenAPI Client Configuration
 *
 * Configures the auto-generated OpenAPI client with:
 * - Base URL
 * - Authentication headers (Bearer token or X-Test-User-Id)
 * - Request/response interceptors
 */

import { client } from '@/data/types/client.gen'

/**
 * Get authentication headers for API requests
 * In development mode with test user, uses X-Test-User-Id header
 * Otherwise uses Bearer token from sessionStorage
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}

  // Only access localStorage/sessionStorage in browser environment
  if (typeof window === 'undefined') {
    return headers
  }

  // Check for test user first (works in any environment if testUserId is set)
  const testUserId = localStorage.getItem('testUserId')
  if (testUserId) {
    headers['X-Test-User-Id'] = testUserId
    return headers // Return early, don't add Authorization header
  }

  // Add Authorization header for real users
  const userToken = sessionStorage.getItem('user_token')
  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`
  }

  return headers
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
}

// Auto-configure on import (only in browser)
if (typeof window !== 'undefined') {
  configureOpenAPIClient()
}