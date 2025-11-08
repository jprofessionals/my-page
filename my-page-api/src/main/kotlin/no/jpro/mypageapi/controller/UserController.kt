package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.web.bind.annotation.RequestMapping

/**
 * UserController has been replaced by UserApiDelegateImpl
 * All endpoints are now handled by OpenAPI-generated controllers
 *
 * Migrated endpoints (use UserApiDelegateImpl):
 * - GET /me -> getMe()
 * - GET /user -> getUsers()
 * - PATCH /user -> updateUser() (includes toggleAdmin, toggleActive, initializeNewEmployee)
 */
// Disabled to prevent ambiguous handler mapping conflicts
//@RestController
@RequestMapping("user")
@SecurityRequirement(name = "Bearer Authentication")
class UserController(
    private val userService: UserService,
    private val userMapper: UserMapper,
    private val environment: org.springframework.core.env.Environment,
    private val userRepository: no.jpro.mypageapi.repository.UserRepository
) {
    // All methods migrated to UserApiDelegateImpl
}