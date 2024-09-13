package no.jpro.mypageapi.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.integration.jdbc.lock.DefaultLockRepository
import org.springframework.integration.jdbc.lock.JdbcLockRegistry
import org.springframework.integration.jdbc.lock.LockRepository
import org.springframework.integration.support.locks.LockRegistry
import org.springframework.http.HttpMethod
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.core.GrantedAuthorityDefaults
import org.springframework.security.web.SecurityFilterChain
import org.springframework.transaction.annotation.EnableTransactionManagement
import javax.sql.DataSource


@Configuration
@EnableTransactionManagement
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
class ApplicationConfig {

    @Bean
    fun springShopOpenAPI(): OpenAPI? {
        return OpenAPI()
            .info(
                Info().title("My Page API")
                    .description("API for the My Page app")
                    .version("v0.0.1")
            )
    }

    @Bean
    fun filterChain(
        http: HttpSecurity,
        customJwtAuthenticationConverter: CustomJwtAuthenticationConverter
    ): SecurityFilterChain {
        http.authorizeHttpRequests { authz ->
            authz.requestMatchers(
                        "/open/**",
                        "/v3/api-docs", "/v3/api-docs/**",
                        "/swagger-ui.html", "/swagger-ui/**",
                        "/actuator/**", "/explorationSock",
                        "/explorationSock/**",
                "/task/**","/task/drawPendingBookings","/task/auto/drawPendingBookings","/task/notifyUpcomingBookings"
            ).permitAll().requestMatchers(HttpMethod.GET, "/settings").permitAll() //Alle (også ikke-påloggede brukere som vil bruke
                                                                                   //lønnskalkulatoren) skal kunne kalle "GET /settings"
                .requestMatchers("/**").authenticated()
        }
            .csrf { csrf ->
                csrf.disable()
            }
            .oauth2ResourceServer { server ->
                server.jwt { jwt ->
                    jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter)
                }
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
