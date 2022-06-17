package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import org.springframework.security.oauth2.jwt.Jwt

interface UserService {
    fun getEmail(jwt: Jwt): String

    fun getName(jwt: Jwt): String

    fun getFamilyName(jwt: Jwt): String

    fun getGivenName(jwt: Jwt): String

    fun getIcon(jwt: Jwt): String

    fun getID(jwt: Jwt): String

    fun getAndCreateUser(jwt: Jwt): UserDTO

}
