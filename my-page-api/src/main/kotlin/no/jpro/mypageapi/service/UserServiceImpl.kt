package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.UserMapper

import org.springframework.stereotype.Service

@Service
class UserServiceImpl(private val userRepository: UserRepository,
                      private val userMapper: UserMapper
) : UserService {
    override fun createUser(userDTO: UserDTO): UserDTO  {
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
}