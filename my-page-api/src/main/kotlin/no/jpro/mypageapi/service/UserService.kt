package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.UserDTO

interface UserService {

    fun createUser(userDTO: UserDTO): UserDTO
    fun getUsers(): List<UserDTO>
}