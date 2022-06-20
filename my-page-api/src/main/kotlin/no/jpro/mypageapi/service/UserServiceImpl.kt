package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.oauth2.jwt.Jwt

import org.springframework.stereotype.Service

@Service
class UserServiceImpl(
    private val userRepository: UserRepository,
    private val userMapper: UserMapper, private val jwtService: JwtService
) : UserService {
    override fun getOrCreateUser(jwt: Jwt): UserDTO {
        val user =
            userRepository.findByIdOrNull(jwtService.getID(jwt)) ?: userRepository.save(userMapper.fromJwtToUser(jwt))
        return userMapper.fromUserToUserDTO(user)
    }
}
