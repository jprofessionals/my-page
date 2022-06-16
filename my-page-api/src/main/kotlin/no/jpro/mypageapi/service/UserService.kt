package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import org.springframework.security.oauth2.jwt.Jwt
import java.security.Principal

interface UserService {

    fun createUser(userDTO: UserDTO): UserDTO
    fun getUsers(): List<UserDTO>
    fun getEmail(jwt: Jwt): String

    fun getName(jwt: Jwt): String
    abstract fun getUser(jwt: Jwt): UserDTO
}
