package no.jpro.mypageapi.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Instant

/**
 * Authentication filter that supports X-Test-User-Id and X-Test-User-Email headers in development/test mode.
 * This filter runs before OAuth2 JWT authentication and allows tests to authenticate
 * using a user ID or email header instead of JWT tokens.
 */
class TestUserAuthenticationFilter(
    private val userRepository: UserRepository
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // Check for X-Test-User-Email header first (preferred), then X-Test-User-Id
        val testUserEmail = request.getHeader("X-Test-User-Email")
        val testUserId = request.getHeader("X-Test-User-Id")

        val user = when {
            testUserEmail != null -> userRepository.findUserByEmail(testUserEmail)
            testUserId != null -> {
                try {
                    val userId = testUserId.toLong()
                    userRepository.findById(userId).orElse(null)
                } catch (e: NumberFormatException) {
                    null
                }
            }
            else -> null
        }

        if (user != null) {
            // Create authentication with user's authorities
            val authorities = mutableListOf<SimpleGrantedAuthority>()
            if (user.admin) {
                authorities.add(SimpleGrantedAuthority("ADMIN"))
            }
            authorities.add(SimpleGrantedAuthority("USER"))

            // Create mock JWT for test user
            // Use email as fallback for sub if sub is null (for users without Google auth)
            val subClaim = user.sub ?: "test-user-${user.id}"
            val jwtBuilder = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("sub", subClaim)
                .claim("email", user.email)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))

            // Only add optional claims if they're not null
            user.name?.let { jwtBuilder.claim("name", it) }
            user.givenName?.let { jwtBuilder.claim("given_name", it) }
            user.familyName?.let { jwtBuilder.claim("family_name", it) }
            user.icon?.let { jwtBuilder.claim("picture", it) }

            val jwt = jwtBuilder.build()

            val authentication = JwtAuthenticationToken(jwt, authorities)

            // Set authentication in security context
            SecurityContextHolder.getContext().authentication = authentication
        }

        filterChain.doFilter(request, response)
    }
}