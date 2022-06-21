package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.service.UserService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("me")
@SecurityRequirement(name = "Bearer Authentication")
class MeController(private val userService: UserService) {
    @GetMapping("")
    fun getCurrentLoggedInUser(@AuthenticationPrincipal jwt: Jwt): UserDTO = userService.getOrCreateUser(jwt)
}
