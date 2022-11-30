package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.BudgetTypeDTO
import no.jpro.mypageapi.service.BudgetService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("budgetTypes")
@SecurityRequirement(name = "Bearer Authentication")
class BudgetTypeController(
    private val budgetService: BudgetService
) {
    @PostMapping("")
    @Operation(summary = "Create a budgetType.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = BudgetTypeDTO::class))]
    )
    @RequiresAdmin
    fun createBudgetType(
        @RequestBody budgetTypeDTO: BudgetTypeDTO
    ): BudgetTypeDTO {
        return budgetService.createBudgetType(budgetTypeDTO)
    }

    @GetMapping("")
    @Operation(summary = "Get the different budgetTypes.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = BudgetTypeDTO::class)))]
    )
    fun getBudgetTypes(): List<BudgetTypeDTO> {
        return budgetService.getBudgetTypes()
    }

    @PatchMapping("/{budgetTypeId}/allowTimeBalance")
    @Operation(summary = "Change whether a budgetType should keep track of hours spent")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = BudgetTypeDTO::class))]
    )
    @RequiresAdmin
    fun patchBudgetTypeAllowTimeBalance(
        @RequestBody allowTimeBalance: Boolean,
        @PathVariable("budgetTypeId") budgetTypeId: Long
    ): ResponseEntity<BudgetTypeDTO> {
        if (!budgetService.checkIfBudgetTypeExists(budgetTypeId)) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.updateBudgetTypeAllowTimeBalance(budgetTypeId, allowTimeBalance))
    }
}
