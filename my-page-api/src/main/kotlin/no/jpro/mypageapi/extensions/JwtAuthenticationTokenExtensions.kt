package no.jpro.mypageapi.extensions

import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken

fun JwtAuthenticationToken.getSub() : String {
    return (credentials as Jwt).claims["sub"] as String
}