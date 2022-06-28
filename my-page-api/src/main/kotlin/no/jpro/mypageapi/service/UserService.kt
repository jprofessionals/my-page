package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UpdateUserDTO
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.JwtUtils
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userMapper: UserMapper,
) {
    fun getOrCreateUser(jwt: Jwt): UserDTO {
        val user =
            userRepository.findByIdOrNull(JwtUtils.getID(jwt)) ?: userRepository.save(userMapper.toUser(jwt))
        return userMapper.toUserDTO(user)
    }

    fun updateUser(jwt: Jwt, updateUserDTO: UpdateUserDTO): UserDTO {
        val user = userRepository.findById(JwtUtils.getID(jwt)).get()
        user.nickName = updateUserDTO.nickName ?: user.nickName
        user.startDate = updateUserDTO.startDate ?: user.startDate
        return userMapper.toUserDTO(userRepository.save(user))
    }

}
