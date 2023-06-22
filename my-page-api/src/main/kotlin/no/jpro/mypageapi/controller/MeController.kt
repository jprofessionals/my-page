package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.UserService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("me")
@SecurityRequirement(name = "Bearer Authentication")
class MeController(
    private val userService: UserService,
    private val budgetService: BudgetService
) {

    @GetMapping("")
    @Operation(summary = "Get data for user identified by the bearer token")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserDTO::class))]
    )
    fun getCurrentLoggedInUser(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): UserDTO =
        userService.getOrCreateUser(jwt).apply { this.budgets = null }

    @GetMapping("budgets")
    @Operation(summary = "Get the different budgets that belong to logged in user.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = BudgetDTO::class)
            )
        )]
    )
    fun getBudgets(token: JwtAuthenticationToken): List<BudgetDTO> {
        return budgetService.getBudgets(token.getSub())
    }
}
