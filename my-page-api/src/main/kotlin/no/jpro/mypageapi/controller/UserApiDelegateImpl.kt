package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.UserApiDelegate
import no.jpro.mypageapi.model.UpdateUserRequest
import no.jpro.mypageapi.model.User
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class UserApiDelegateImpl(
    private val userService: UserService,
    private val userMapper: UserMapper,
    private val userRepository: UserRepository,
    private val environment: org.springframework.core.env.Environment,
    private val request: Optional<NativeWebRequest>
) : UserApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getMe(): ResponseEntity<User> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val authentication = SecurityContextHolder.getContext().authentication

        // In development mode, support test user header
        if (isDevelopmentProfile()) {
            val testUser = userService.getTestUserById(testUserId)
            if (testUser != null) {
                return ResponseEntity.ok(userMapper.toUserModel(testUser))
            }
        }

        // Handle JWT authentication (both production and test mode)
        if (authentication is JwtAuthenticationToken) {
            val jwt = authentication.credentials as Jwt
            val userEntity = userService.getOrCreateUser(jwt)
            return ResponseEntity.ok(userMapper.toUserModel(userEntity))
        }

        // For local development without authentication, return 401
        return ResponseEntity.status(401).build()
    }

    // Check if we're running in a development profile (local, h2, or test)
    private fun isDevelopmentProfile(): Boolean {
        return environment.activeProfiles.any { it == "local" || it == "h2" || it == "test" }
    }

    override fun getUsers(isEnabled: Boolean?): ResponseEntity<List<User>> {
        val enabled = isEnabled ?: true
        val users = userService.getAllUsers(enabled)
        val userModels = users.map { userMapper.toUserModel(it) }
        return ResponseEntity.ok(userModels)
    }

    override fun updateUser(updateUserRequest: UpdateUserRequest): ResponseEntity<Unit> {
        if (updateUserRequest.isAdmin != null) {
            userService.updateAdmin(updateUserRequest.email!!, updateUserRequest.isAdmin!!)
        }
        if (updateUserRequest.isActive != null) {
            userService.updateActive(updateUserRequest.email!!, updateUserRequest.isActive!!)
        }
        return ResponseEntity.ok().build()
    }
}