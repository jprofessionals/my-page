package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreateBudgetDTO
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.utils.JwtUtils
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("budgets")
class BudgetController(private val budgetService: BudgetService) {
    @GetMapping("")
    @Operation(summary = "Get the different budgets that belong to logged in user.")
    fun getBudgets(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): List<BudgetDTO> {
        val id = JwtUtils.getID(jwt)
        return budgetService.getBudgetsToLoggedInUser(id)

    }

    @PostMapping("")
    @Operation(summary = "Create a budget for the logged in user")
    fun createBudget(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @RequestBody createBudgetDTO: CreateBudgetDTO
    ): BudgetDTO {
        val id = JwtUtils.getID(jwt)
        return budgetService.createBudget(id, createBudgetDTO)

    }
}