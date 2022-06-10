package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.utils.JwtUtils
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service


@Service
class UserMapper() : Mapper<UserDTO, User, Jwt> {
    override fun fromUserToUserDTO(user: User): UserDTO = UserDTO(
        user.email,
        user.name,
        user.givenName,
        user.familyName,
        user.icon,
        user.nickName,
        user.startDate
    )

    override fun fromJwtToUser(jwt: Jwt): User = User(
        JwtUtils.getID(jwt),
        JwtUtils.getEmail(jwt),
        JwtUtils.getName(jwt),
        JwtUtils.getGivenName(jwt),
        JwtUtils.getFamilyName(jwt),
        JwtUtils.getIcon(jwt)
    )

}
