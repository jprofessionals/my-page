package no.jpro.mypageapi.utils.mapper

import org.springframework.security.oauth2.jwt.Jwt

interface Mapper<UserDTO, User, Jwt> {
fun fromUserToUserDTO(user: User): UserDTO
fun fromJwtToUser(jwt: Jwt): User

}
