package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.UserService
import org.springframework.web.bind.annotation.*

@RestController()
@RequestMapping("test")
class TestController(private val userRepository: UserRepository, private val userService: UserService) {
    @GetMapping("")
    fun sayHelloSecure(): String? {
        return String.format("Hello from the secure API.")
    }

    @PostMapping("users")
    fun createUser(@RequestBody userDTO: UserDTO): UserDTO {
        return userService.createUser(userDTO)
    }
    @GetMapping("users")
    fun getUsers(): List<UserDTO> = userService.getUsers();


}