package no.jpro.mypageapi.controller

import no.jpro.mypageapi.model.Employee
import no.jpro.mypageapi.model.User
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.web.bind.annotation.*
import java.security.Principal

@RestController()
@RequestMapping("test")
class TestController(private val userRepository: UserRepository) {
    @GetMapping("")
    fun sayHelloSecure(principal: Principal): String? {
        return String.format("Hello from the secure API.")
    }

    @GetMapping("users")
    fun getUsers(): List<User> = userRepository.findAll();

    @PostMapping("users")
    fun createUser(@RequestBody user: User): User = userRepository.save(user)
}