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
			.antMatchers("/open/**").permitAll()
			.antMatchers("/**").authenticated()
			.anyRequest().authenticated()
			.and()
			.oauth2ResourceServer()
			.jwt()
	}
}
