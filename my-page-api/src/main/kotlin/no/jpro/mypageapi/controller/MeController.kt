package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.UserService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("me")
class MeController(private val userService: UserService) {

    @GetMapping("")

    fun getCurrentLoggedInUser(@AuthenticationPrincipal jwt: Jwt): UserDTO = userService.getAndCreateUser(jwt)
    }