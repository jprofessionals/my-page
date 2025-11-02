package no.jpro.mypageapi.config

import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver

/**
 * Custom BearerTokenResolver that skips token resolution if authentication is already set.
 * This allows the TestUserAuthenticationFilter to set authentication via X-Test-User-Id header
 * without being overridden by the OAuth2 resource server.
 */
class DevelopmentBearerTokenResolver : BearerTokenResolver {
    private val defaultResolver = DefaultBearerTokenResolver()

    override fun resolve(request: HttpServletRequest): String? {
        // If authentication is already set (by TestUserAuthenticationFilter), don't resolve bearer token
        val authentication = SecurityContextHolder.getContext().authentication
        println("[DevelopmentBearerTokenResolver] Authentication: $authentication, isAuthenticated: ${authentication?.isAuthenticated}, isAnonymous: ${authentication is org.springframework.security.authentication.AnonymousAuthenticationToken}")

        if (authentication != null && authentication.isAuthenticated &&
            authentication !is org.springframework.security.authentication.AnonymousAuthenticationToken) {
            println("[DevelopmentBearerTokenResolver] Skipping bearer token resolution - authentication already set")
            return null
        }

        // Otherwise, use default bearer token resolution
        val token = defaultResolver.resolve(request)
        println("[DevelopmentBearerTokenResolver] Resolved bearer token: ${token != null}")
        return token
    }
}