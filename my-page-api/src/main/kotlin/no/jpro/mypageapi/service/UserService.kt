package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UpdateUserDTO
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.JwtUtils
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
            userRepository.findUserBySub(JwtUtils.getSub(jwt))
                ?: findUserByEmailAndConnect(jwt)
                ?: createUser(jwt)
        return userMapper.toUserDTO(user)
    }

    fun createUser(jwt: Jwt): User {
        return userRepository.save(userMapper.toUser(jwt))
    }

    fun findUserByEmailAndConnect(jwt: Jwt): User? {
        val user = userRepository.findUserByEmailAndSubIsNull(JwtUtils.getEmail(jwt)) ?: return null
        return userRepository.save(
            user.copy(
                sub = JwtUtils.getSub(jwt),
                icon = JwtUtils.getIcon(jwt),
                name = JwtUtils.getName(jwt),
                givenName = JwtUtils.getGivenName(jwt),
                familyName = JwtUtils.getFamilyName(jwt)
            )
        )
    }

    fun checkIfUserExists(userSub: String): Boolean {
        return userRepository.existsUserBySub(userSub)
    }

    fun updateUser(jwt: Jwt, userRequest: UpdateUserDTO): UserDTO? {
        val user = userRepository.findUserBySub(JwtUtils.getSub(jwt)) ?: return null
        return userMapper.toUserDTO(
            userRepository.save(
                user.copy(
                    nickName = userRequest.nickName ?: user.nickName,
                    startDate = userRequest.startDate ?: user.startDate
                )
            )
        )
    }

}
