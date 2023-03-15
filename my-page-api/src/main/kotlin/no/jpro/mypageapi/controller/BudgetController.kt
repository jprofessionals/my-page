package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.dto.UpdatePostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("budget")
@SecurityRequirement(name = "Bearer Authentication")
class BudgetController(private val userService: UserService, private val budgetService: BudgetService) {

    @GetMapping("{employeeNumber}")
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
    fun getBudgets(
        token: JwtAuthenticationToken,
        @PathVariable("employeeNumber") employeeNumber: Int,
    ): List<BudgetDTO> {
        return budgetService.getBudgets(employeeNumber)
    }

    @PostMapping("{budgetId}/posts")
    @Operation(summary = "Create a new post related to an existing budget.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = PostDTO::class))]
    )
    fun createPost(
        token: JwtAuthenticationToken,
        @Valid @RequestBody postRequest: CreatePostDTO, @PathVariable("budgetId") budgetId: Long,
    ): ResponseEntity<PostDTO> {
        val budget = budgetService.getBudget(budgetId) ?: return ResponseEntity.badRequest().build()
        val user = userService.getUserBySub(token.getSub()) ?: return ResponseEntity.badRequest().build()

        if (!userPermittedToManageBudget(budget, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }

        return ResponseEntity.ok(budgetService.createPost(postRequest, budget, user))
    }

    @DeleteMapping("posts/{postId}")
    @Operation(summary = "Delete a post from based on PostID")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    fun deletePost(token: JwtAuthenticationToken, @PathVariable("postId") postId: Long): ResponseEntity<Void> {
        val postToDelete = budgetService.getPost(postId) ?: return ResponseEntity.notFound().build()
        val user = userService.getUserBySub(token.getSub()) ?: return ResponseEntity.badRequest().build()
        val budget = postToDelete.budget ?: return ResponseEntity.badRequest().build()

        if (!userPermittedToManageBudget(budget, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }
        if (postToDelete.locked) { //TODO: skal admin kunne slette låste poster?
            return ResponseEntity.badRequest().build()
        }
        budgetService.deletePost(postId)
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("posts/{postId}")
    @Operation(summary = "Edit an existing budget post")
    fun editPost(
        token: JwtAuthenticationToken,
        @PathVariable("postId") postId: Long,
        @Valid @RequestBody editPostRequest: UpdatePostDTO,
    ): ResponseEntity<PostDTO> {
        val postToEdit = budgetService.getPost(postId) ?: return ResponseEntity.notFound().build()
        val user = userService.getUserBySub(token.getSub()) ?: return ResponseEntity.badRequest().build()
        val budget = postToEdit.budget ?: return ResponseEntity.badRequest().build()

        if (!userPermittedToManageBudget(budget, user)) {
            return ResponseEntity(HttpStatus.FORBIDDEN)
        }
        if (postToEdit.locked) { //TODO: skal admin kunne endre låste poster?
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.editPost(editPostRequest, postToEdit))
    }

    private fun userPermittedToManageBudget(budget: Budget, user: User) = (budget.user?.id == user.id || user.admin)
}