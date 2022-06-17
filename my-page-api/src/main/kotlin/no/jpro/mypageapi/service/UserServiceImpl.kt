package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.oauth2.jwt.Jwt

import org.springframework.stereotype.Service

@Service
class UserServiceImpl(private val userRepository: UserRepository,
                      private val userMapper: UserMapper
) : UserService {

    override fun getEmail(jwt: Jwt): String {
        return jwt.getClaimAsString("email")
    }

    override fun getName(jwt: Jwt): String {
        return jwt.getClaimAsString("name")
    }
    override fun getGivenName(jwt: Jwt): String {
        return jwt.getClaimAsString("given_name")
    }

    override fun getFamilyName(jwt: Jwt): String {
        return jwt.getClaimAsString("family_name")
    }

    override fun getIcon(jwt: Jwt): String {
        return jwt.getClaimAsString("picture")
    }

    override fun getID(jwt: Jwt): String {
        return jwt.getClaimAsString("sub")
    }

    override fun getAndCreateUser(jwt: Jwt): UserDTO{
        val user = userRepository.findByIdOrNull(getID(jwt)) ?: userRepository.save(User(getID(jwt), getEmail(jwt), getName(jwt), getGivenName(jwt),getFamilyName(jwt),getIcon(jwt)))
        return userMapper.fromEntity(user)
    }

}
