package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.*
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userMapper: UserMapper,
) {
    fun getOrCreateUser(jwt: Jwt): UserDTO {
        val user =
            userRepository.findUserBySub(jwt.getSub())
                ?: findUserByEmailAndConnect(jwt)
                ?: createUser(jwt)
        return userMapper.toUserDTO(user)
    }

    fun createUser(jwt: Jwt): User {
        return userRepository.save(userMapper.toUser(jwt))
    }

    fun createUser(userDTO: UserDTO): UserDTO {
        val user = userMapper.toUser(userDTO)

        userRepository.save(user)

        return userDTO
    }

    fun findUserByEmailAndConnect(jwt: Jwt): User? {
        val user = userRepository.findUserByEmailAndSubIsNull(jwt.getEmail()) ?: return null
        return userRepository.save(
            user.copy(
                sub = jwt.getSub(),
                icon = jwt.getIcon(),
                name = jwt.getName(),
                givenName = jwt.getGivenName(),
                familyName = jwt.getFamilyName()
            )
        )
    }

    fun checkIfUserExists(userSub: String): Boolean {
        return userRepository.existsUserBySub(userSub)
    }

    fun getAllUsers() = userRepository.findAll().map { userMapper.toUserDTO(it) }
}
