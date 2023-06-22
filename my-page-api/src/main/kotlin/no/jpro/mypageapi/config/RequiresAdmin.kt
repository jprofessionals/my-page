package no.jpro.mypageapi.config

import org.springframework.security.access.annotation.Secured

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@Secured("ADMIN")
annotation class RequiresAdmin
