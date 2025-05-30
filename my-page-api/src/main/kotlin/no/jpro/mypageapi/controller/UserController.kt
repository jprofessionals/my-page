package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.NewEmployeeDTO
import no.jpro.mypageapi.dto.ToggleActiveDTO
import no.jpro.mypageapi.dto.ToggleAdminDTO
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("user")
@SecurityRequirement(name = "Bearer Authentication")
class UserController(
    private val userService: UserService,
    private val userMapper: UserMapper
) {

    private val logger = LoggerFactory.getLogger(UserController::class.java)

    @GetMapping
    @Transactional
    @RequiresAdmin
    fun getAllUsers(@RequestParam isEnabled: Boolean = true): List<UserDTO> = userService.getAllUsers(isEnabled)

    @PostMapping
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Create a new employee")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(
        responseCode = "201",
        description = "Employee created",
        content = [Content(schema = Schema(implementation = UserDTO::class))]
    )
    fun initializeNewEmployee(
        token: JwtAuthenticationToken,
        @Valid @RequestBody newEmployeeDTO: NewEmployeeDTO
    ): UserDTO {
        logger.info("Initializing new employee with email ${newEmployeeDTO.email}")
        val user = userService.initializeNewEmployee(
            newEmployeeDTO.email,
            newEmployeeDTO.employeeNumber,
            newEmployeeDTO.budgetStartDate
        )

        return userMapper.toUserDTO(user)
    }

    @PatchMapping()
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Toggle admin")
    @ResponseStatus(HttpStatus.OK)
    @ApiResponse(
        responseCode = "200",
        description = "Admin updated",
        content = [Content(schema = Schema(implementation = UserDTO::class))]
    )
    fun toggleAdmin(
        token: JwtAuthenticationToken,
        @Valid @RequestBody toggleAdminDTO: ToggleAdminDTO
    ): UserDTO {
        logger.info("Toggle admin for ${toggleAdminDTO.email}")
        val user = userService.updateAdmin(toggleAdminDTO.email, toggleAdminDTO.isAdmin)
        return userMapper.toUserDTO(user)
    }

    @PatchMapping("active")
    @Transactional
    @RequiresAdmin
    @Operation(summary = "Toggle active")
    @ResponseStatus(HttpStatus.OK)
    @ApiResponse(
        responseCode = "200",
        description = "Status updated",
        content = [Content(schema = Schema(implementation = UserDTO::class))]
    )
    fun toggleAdmin(
        token: JwtAuthenticationToken,
        @Valid @RequestBody toggleActiveDTO: ToggleActiveDTO
    ): UserDTO {
        logger.info("Toggle aktiv for ${toggleActiveDTO.email}")
        val user = userService.updateActive(toggleActiveDTO.email, toggleActiveDTO.isActive)
        return userMapper.toUserDTO(user)
    }
}
