package no.jpro.mypageapi

import io.swagger.v3.oas.annotations.OpenAPIDefinition
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType
import io.swagger.v3.oas.annotations.security.SecurityScheme
import io.swagger.v3.oas.annotations.servers.Server
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain

@OpenAPIDefinition(
    servers = [Server(url = "/api")]
)
@SecurityScheme(
    name = "Bearer Authentication",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer"
)
@EnableWebSecurity
@SpringBootApplication
class MyPageApiApplication

fun main(args: Array<String>) {
    runApplication<MyPageApiApplication>(*args)
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
