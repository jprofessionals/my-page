package no.jpro.mypageapi.service

import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service

@Service
class JwtServiceImpl : JwtService{
    override fun getEmail(jwt: Jwt): String {
        return jwt.getClaimAsString("email")    }

    override fun getName(jwt: Jwt): String {
        return jwt.getClaimAsString("name")
    }

    override fun getFamilyName(jwt: Jwt): String {
        return jwt.getClaimAsString("family_name")
    }

    override fun getGivenName(jwt: Jwt): String {
        return jwt.getClaimAsString("given_name")
    }

    override fun getIcon(jwt: Jwt): String {
        return jwt.getClaimAsString("picture")
    }

    override fun getID(jwt: Jwt): String {
        return jwt.getClaimAsString("sub")
    }


}