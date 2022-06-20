package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.service.JwtService
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service


@Service
class UserMapper (private val jwtService: JwtService): Mapper<UserDTO, User, Jwt>  {
    override fun fromUserToUserDTO(user: User): UserDTO = UserDTO(
        user.email,
        user.name,
        user.givenName,
        user.familyName,
        user.icon
    )

    override fun fromJwtToUser(jwt: Jwt): User=User(
        jwtService.getID(jwt),
        jwtService.getEmail(jwt),
        jwtService.getName(jwt),
        jwtService.getGivenName(jwt),
        jwtService.getFamilyName(jwt),
        jwtService.getIcon(jwt)
    )


}