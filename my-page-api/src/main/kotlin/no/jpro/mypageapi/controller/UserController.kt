package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.service.UserService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("user")
@SecurityRequirement(name = "Bearer Authentication")
class UserController (private val userService: UserService) {

    @GetMapping
    @RequiresAdmin
    fun getAllUsers(): List<UserDTO> = userService.getAllUsers()
}