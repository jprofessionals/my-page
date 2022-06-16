package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.UserService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import java.security.Principal

@RestController
@RequestMapping("users")
class UserController(private val userRepository: UserRepository, private val userService: UserService) {
    //@PostMapping("postUsers")
   // fun createUser(@RequestBody userDTO: UserDTO): UserDTO {
      //  return userService.createUser(userDTO)
   // }
    @GetMapping("getUsers")
    fun getUsers(): List<UserDTO> = userService.getUsers();

    @GetMapping("/user")

    fun getUser(@AuthenticationPrincipal jwt: Jwt): UserDTO = userService.getUser(jwt);
    }