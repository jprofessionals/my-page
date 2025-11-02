package no.jpro.mypageapi.config

import no.jpro.mypageapi.repository.UserRepository
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
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.transaction.annotation.EnableTransactionManagement
import javax.sql.DataSource


@Configuration
@EnableTransactionManagement
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
class ApplicationConfig(
    private val environment: Environment,
    private val userRepository: UserRepository
) {

    @Bean
    fun testUserAuthenticationFilter(): TestUserAuthenticationFilter {
        return TestUserAuthenticationFilter(userRepository)
    }

    @Bean
    fun filterChain(
        http: HttpSecurity,
        customJwtAuthenticationConverter: CustomJwtAuthenticationConverter,
        testUserAuthenticationFilter: TestUserAuthenticationFilter
    ): SecurityFilterChain {
        // Check which profile we're in to determine authentication requirements
        val isLocalDevelopment = environment.activeProfiles.any { it == "local" || it == "h2" }
        val isDevelopmentOrTest = environment.activeProfiles.any { it == "local" || it == "h2" || it == "test" }

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
            .csrf { csrf ->
                csrf.disable()
            }

        // Enable OAuth2 resource server
        http.oauth2ResourceServer { server ->
            server.jwt { jwt ->
                jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter)
            }
        }

        // Add X-Test-User-Id authentication filter in development/test mode
        // This runs BEFORE JWT authentication to set authentication first
        if (isDevelopmentOrTest) {
            http.addFilterBefore(
                testUserAuthenticationFilter,
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
