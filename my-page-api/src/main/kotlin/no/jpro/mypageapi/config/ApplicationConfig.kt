package no.jpro.mypageapi.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain

@Configuration
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
    fun filterChain(http: HttpSecurity) : SecurityFilterChain {
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

        return http.build()
    }
}