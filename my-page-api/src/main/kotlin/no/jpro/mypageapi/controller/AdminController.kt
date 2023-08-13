package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.service.BudgetService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("admin")
@SecurityRequirement(name = "Bearer Authentication")
@RequiresAdmin
class AdminController(
    private val budgetService: BudgetService,
) {
    @GetMapping("budgetSummary")
    @Transactional
    @Operation(summary = "Get summary of all budgets per year")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserDTO::class))]
    )
    fun getBudgetSummary(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): List<BudgetSummary> {
        return budgetService.getSummary()
    }
}
