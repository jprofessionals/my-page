package no.jpro.mypageapi.config

import org.springframework.core.convert.converter.Converter
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken

class CustomJwtAuthenticationConverter(private val authoritiesConverter: CustomJwtGrantedAuthoritiesConverter) : Converter<Jwt, AbstractAuthenticationToken> {

    override fun convert(source: Jwt): AbstractAuthenticationToken {
        val authorities = authoritiesConverter.convert(source)
        return JwtAuthenticationToken(source, authorities)

    }
}