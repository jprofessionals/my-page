package no.jpro.mypageapi.utils.mapper

import org.springframework.security.oauth2.jwt.Jwt

class JwtUtils {
    companion object {
        fun getEmail(jwt: Jwt): String {
            return jwt.getClaimAsString("email")
        }
    }
}