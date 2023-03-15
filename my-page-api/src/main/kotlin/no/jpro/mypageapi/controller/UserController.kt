package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("user")
@SecurityRequirement(name = "Bearer Authentication")
class UserController(private val userService: UserService) {

    @GetMapping
    @RequiresAdmin
    fun getAllUsers(): List<UserDTO> = userService.getAllUsers()

    @PostMapping
    @RequiresAdmin
    fun postUser(@Valid @RequestBody userDTO: UserDTO): ResponseEntity<UserDTO> {
        val postedUser = userService.createUser(userDTO)

        return ResponseEntity.ok(postedUser)
    }
}