package no.jpro.mypageapi

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter

@SpringBootApplication
class MyPageApiApplication

fun main(args: Array<String>) {
    runApplication<MyPageApiApplication>(*args)
}

@EnableWebSecurity
class SpringSecurityConfiguration : WebSecurityConfigurerAdapter() {
    override fun configure(http: HttpSecurity) {
        http.authorizeRequests()
            .antMatchers(
                "/open/**",
                "/v3/api-docs",
                "/v3/api-docs/**",
                "/swagger-ui.html",
                "/swagger-ui/**",
            ).permitAll()
            .antMatchers("/**").authenticated()
            .and()
            .csrf().disable()
            .oauth2ResourceServer()
            .jwt()
    }
}
