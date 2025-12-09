package no.jpro.mypageapi.config

import no.jpro.mypageapi.repository.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.http.HttpMethod
import org.springframework.integration.jdbc.lock.DefaultLockRepository
import org.springframework.integration.jdbc.lock.JdbcLockRegistry
import org.springframework.integration.jdbc.lock.LockRepository
import org.springframework.integration.support.locks.LockRegistry
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.core.GrantedAuthorityDefaults
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.transaction.annotation.EnableTransactionManagement
import javax.sql.DataSource


@Configuration
@EnableTransactionManagement
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
class ApplicationConfig(
    private val environment: Environment,
    private val userRepository: UserRepository,
    @Value("\${security.test-auth.enabled:false}") private val testAuthEnabled: Boolean
) {

    @Bean
    fun filterChain(
        http: HttpSecurity,
        customJwtAuthenticationConverter: CustomJwtAuthenticationConverter
    ): SecurityFilterChain {
        // Check which profile we're in to determine authentication requirements
        val isLocalDevelopment = environment.activeProfiles.any { it == "local" || it == "h2" }

        http.authorizeHttpRequests { authz ->
            // Base endpoints that are always permitted
            val basePermittedEndpoints = mutableListOf(
                "/open/**",
                "/v3/api-docs", "/v3/api-docs/**",
                "/swagger-ui.html", "/swagger-ui/**",
                "/actuator/**", "/explorationSock",
                "/explorationSock/**",
                "/task/**","/task/drawPendingBookings",
                "/task/auto/drawPendingBookings",
                "/task/notifyUpcomingBookings",
                "/job/generate-notifications"
            )

            // Add development-only endpoints if in local/h2 profile
            if (isLocalDevelopment) {
                basePermittedEndpoints.addAll(listOf(
                    "/cabin-lottery", "/cabin-lottery/**",
                    "/me", "/me/**",
                    "/booking", "/booking/**",
                    "/user", "/user/**",
                    "/image", "/image/**"
                ))
            }

            authz.requestMatchers(*basePermittedEndpoints.toTypedArray())
                .permitAll()
                .requestMatchers(HttpMethod.GET, "/settings").permitAll()
                .requestMatchers("/**").authenticated()
        }

        // CSRF protection is disabled because this is a stateless REST API using JWT tokens
        // in Authorization headers (not cookies). JWT tokens in headers are immune to CSRF
        // attacks since the browser never automatically attaches them to requests.
        // See: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
        http.csrf { csrf -> csrf.disable() }

        // Stateless session management - no session cookies used
        http.sessionManagement { session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        }

        // Enable OAuth2 resource server with JWT authentication
        http.oauth2ResourceServer { server ->
            server.jwt { jwt ->
                jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter)
            }
        }

        // SECURITY: X-Test-User-Id authentication is ONLY enabled when security.test-auth.enabled=true
        // This property should ONLY be set in test profile (application-test.properties)
        // and NEVER in production configurations.
        if (testAuthEnabled) {
            http.addFilterBefore(
                TestUserAuthenticationFilter(userRepository),
                org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter::class.java
            )
        }

        return http.build()
    }

    @Bean
    fun customJwtAuthenticationConverter(jdbcTemplate: JdbcTemplate): CustomJwtAuthenticationConverter {
        return CustomJwtAuthenticationConverter(CustomJwtGrantedAuthoritiesConverter(jdbcTemplate))
    }

    @Bean
    fun grantedAuthorityDefaults(): GrantedAuthorityDefaults? {
        return GrantedAuthorityDefaults("") // Remove the ROLE_ prefix
    }

    @Bean
    fun lockRepository(dataSource: DataSource): LockRepository {
        val lockRepository = DefaultLockRepository(dataSource)
        lockRepository.setTimeToLive(1000 * 60) //1 minute
        return lockRepository
    }

    @Bean
    fun lockRegistry(lockRepository: LockRepository): LockRegistry {
        return JdbcLockRegistry(lockRepository)
    }

}
