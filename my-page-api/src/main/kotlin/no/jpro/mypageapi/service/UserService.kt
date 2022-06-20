package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import org.springframework.security.oauth2.jwt.Jwt

interface UserService {

    fun getOrCreateUser(jwt: Jwt): UserDTO


}
