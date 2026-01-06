package no.jpro.mypageapi.utils

import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.UserService
import org.springframework.core.env.Environment
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Component

/**
 * Helper class for authentication-related operations.
 *
 * Provides common functionality for:
 * - Development profile detection
 * - Test user retrieval
 * - Current user retrieval from JWT or test headers
 */
@Component
class AuthenticationHelper(
    private val environment: Environment,
    private val userRepository: UserRepository,
    private val userService: UserService
) {

    /**
     * Check if we're running in a development/test profile (local, h2, or test)
     */
    fun isDevelopmentProfile(): Boolean {
        return environment.activeProfiles.any { it == "local" || it == "h2" || it == "test" }
    }

    /**
     * For local development - get user by ID from test header
     */
    fun getTestUserById(testUserId: String?): User? {
        if (testUserId == null) return null
        return try {
            userRepository.findById(testUserId.toLong()).orElse(null)
        } catch (e: NumberFormatException) {
            null
        }
    }

    /**
     * Get current user from JWT authentication token
     *
     * @param testUserId Optional test user ID for development mode
     * @return User or null if not authenticated
     */
    fun getCurrentUser(testUserId: String? = null): User? {
        // In development mode, support test user header
        if (isDevelopmentProfile() && testUserId != null) {
            val testUser = getTestUserById(testUserId)
            if (testUser != null) {
                return testUser
            }
        }

        // Get user from JWT authentication
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication is JwtAuthenticationToken) {
            val sub = authentication.getSub()
            return userService.getValidUserBySub(sub)
        }

        return null
    }

    /**
     * Get current user or throw exception if not authenticated
     *
     * @param testUserId Optional test user ID for development mode
     * @return User (never null)
     * @throws IllegalStateException if no authentication provided
     */
    fun getCurrentUserOrThrow(testUserId: String? = null): User {
        return getCurrentUser(testUserId)
            ?: throw IllegalStateException("No authentication provided")
    }

    /**
     * Get current user's sub from JWT or test user
     *
     * @param testUserId Optional test user ID for development mode
     * @return User sub string or null if not authenticated
     */
    fun getCurrentUserSub(testUserId: String? = null): String? {
        // In development mode, support test user header
        if (isDevelopmentProfile() && testUserId != null) {
            val testUser = getTestUserById(testUserId)
            if (testUser?.sub != null) {
                return testUser.sub
            }
        }

        // Get sub from JWT authentication
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication is JwtAuthenticationToken) {
            return authentication.getSub()
        }

        return null
    }

    /**
     * Get current user's sub or throw exception if not authenticated
     *
     * @param testUserId Optional test user ID for development mode
     * @return User sub string (never null)
     * @throws IllegalStateException if no authentication provided
     */
    fun getCurrentUserSubOrThrow(testUserId: String? = null): String {
        return getCurrentUserSub(testUserId)
            ?: throw IllegalStateException("No authentication provided")
    }
}