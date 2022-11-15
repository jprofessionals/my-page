package no.jpro.mypageapi.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.core.GrantedAuthorityDefaults
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true)
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
    fun filterChain(http: HttpSecurity, customJwtAuthenticationConverter: CustomJwtAuthenticationConverter) : SecurityFilterChain {
        http
            .authorizeRequests()
            .antMatchers(
                "/open/**",
                "/v3/api-docs",
                "/v3/api-docs/**",
                "/swagger-ui.html",
                "/swagger-ui/**",
                "/actuator/**",
            ).permitAll()
            .antMatchers("/**").authenticated()
            .and()
            .csrf().disable()
            .oauth2ResourceServer()
            .jwt()
            .jwtAuthenticationConverter(customJwtAuthenticationConverter)

        return http.build()
    }

    @Bean
    fun customJwtAuthenticationConverter(jdbcTemplate: JdbcTemplate) : CustomJwtAuthenticationConverter {
        return CustomJwtAuthenticationConverter(CustomJwtGrantedAuthoritiesConverter(jdbcTemplate))
    }

    @Bean
    fun grantedAuthorityDefaults(): GrantedAuthorityDefaults? {
        return GrantedAuthorityDefaults("") // Remove the ROLE_ prefix
    }
}