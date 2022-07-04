package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.dto.BudgetTypeDTO
import no.jpro.mypageapi.service.BudgetService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("budgetTypes")
@SecurityRequirement(name = "Bearer Authentication")
class BudgetTypeController(
    private val budgetService: BudgetService
) {
    @PostMapping("")
    @Operation(summary = "Create a budgetType.")
    fun createBudgetType(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @RequestBody budgetTypeDTO: BudgetTypeDTO
    ): BudgetTypeDTO {
        return budgetService.createBudgetType(budgetTypeDTO)
    }

    @GetMapping("")
    @Operation(summary = "Get the different budgetTypes.")
    fun getBudgetTypes(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): List<BudgetTypeDTO> {
        return budgetService.getBudgetTypes()
    }
}
