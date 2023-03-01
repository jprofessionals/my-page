package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.UserService
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("user")
@SecurityRequirement(name = "Bearer Authentication")
class UserController(
    private val userService: UserService,
    private val budgetService: BudgetService
) {

    @GetMapping
    @RequiresAdmin
    fun getAllUsers(): List<UserDTO> = userService.getAllUsers()

    @GetMapping("budgets/{employeeNumber}")
    @RequiresAdmin
    @Operation(summary = "Get the different budgets that belong to specified user.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BudgetDTO::class)
            )
        )]
    )
    fun getBudgets(token: JwtAuthenticationToken, @PathVariable("employeeNumber") employeeNumber: Int,): List<BudgetDTO> {
        return budgetService.getBudgets(employeeNumber)
    }
}