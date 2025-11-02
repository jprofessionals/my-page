package no.jpro.mypageapi.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Filter that runs AFTER BearerTokenAuthenticationFilter to preserve test authentication.
 * If BearerTokenAuthenticationFilter cleared the authentication (because no bearer token was found),
 * this filter restores it if it was set by TestUserAuthenticationFilter.
 */
class PreserveTestAuthenticationFilter : OncePerRequestFilter() {

    companion object {
        private const val TEST_AUTH_ATTRIBUTE = "TEST_AUTHENTICATION"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // Get authentication that was set before this filter
        val testAuth = request.getAttribute(TEST_AUTH_ATTRIBUTE) as? org.springframework.security.core.Authentication

        // Continue with the filter chain
        filterChain.doFilter(request, response)

        // After filter chain, check if authentication was cleared and restore if needed
        if (testAuth != null) {
            val currentAuth = SecurityContextHolder.getContext().authentication
            if (currentAuth == null || !currentAuth.isAuthenticated ||
                currentAuth is org.springframework.security.authentication.AnonymousAuthenticationToken) {
                println("[PreserveTestAuth] Restoring test authentication: ${testAuth.principal}")
                SecurityContextHolder.getContext().authentication = testAuth
            }
        }
    }
}