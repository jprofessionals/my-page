package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import org.springframework.stereotype.Service

@Service
class UserMapper: Mapper<UserDTO, User> {
    override fun fromEntity(entity: User): UserDTO = UserDTO(
        entity.email,
        entity.name,
        entity.givenName,
        entity.familyName,
        entity.icon
    )


}