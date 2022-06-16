package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.security.oauth2.jwt.Jwt

import org.springframework.stereotype.Service
import java.security.Principal

@Service
class UserServiceImpl(private val userRepository: UserRepository,
                      private val userMapper: UserMapper
) : UserService {
    override fun createUser(userDTO: UserDTO): UserDTO {
        val user = userMapper.toEntity(userDTO)
        userRepository.save(user)
        return userMapper.fromEntity(user)
    }


    override fun getUsers(): List<UserDTO> {
        val users = userRepository.getAllUsers()
        return users.map {
            userMapper.fromEntity(it)
        }
    }

    override fun getEmail(jwt: Jwt): String {
        return jwt.getClaimAsString("email")
    }

    override fun getName(jwt: Jwt): String {
        return jwt.getClaimAsString("name")
    }

    override fun getUser(jwt: Jwt): UserDTO {
        val userDTO= UserDTO(getEmail(jwt),getName(jwt))
        return userDTO;
    }
}
