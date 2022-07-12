package no.jpro.mypageapi.utils

import org.springframework.security.oauth2.jwt.Jwt

class JwtUtils {
    companion object {
        fun getEmail(jwt: Jwt): String {
            return jwt.getClaimAsString("email")
        }
        fun getName(jwt: Jwt): String {
            return jwt.getClaimAsString("name")
        }

        fun getFamilyName(jwt: Jwt): String {
            return jwt.getClaimAsString("family_name")
        }

        fun getGivenName(jwt: Jwt): String {
            return jwt.getClaimAsString("given_name")
        }

        fun getIcon(jwt: Jwt): String {
            return jwt.getClaimAsString("picture")
        }

        fun getSub(jwt: Jwt): String {
            return jwt.getClaimAsString("sub")
        }
    }

}
