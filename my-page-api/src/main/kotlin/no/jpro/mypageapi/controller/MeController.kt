package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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

    @PostMapping("budgets/{budgetId}/posts")
    @Operation(summary = "Create a new post related to an existing budget.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = PostDTO::class))]
    )
    fun createPost(
        token: JwtAuthenticationToken,
        @Valid @RequestBody postRequest: CreatePostDTO, @PathVariable("budgetId") budgetId: Long,
    ): ResponseEntity<PostDTO> {
        val userSub = token.getSub()
        if(!userService.checkIfUserExists(userSub)) {
            return ResponseEntity.badRequest().build()
        }
        if (!budgetService.checkIfBudgetExists(userSub, budgetId)) {
            return ResponseEntity.badRequest().build()
        }
        if (budgetService.checkIfDateIsBeforeStartOfBudget(postRequest.date, budgetId)) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.createPost(postRequest, budgetId, userSub))
    }

    @DeleteMapping("posts/{postId}")
    @Operation(summary = "Delete a post from based on PostID")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    fun deletePost(token: JwtAuthenticationToken, @PathVariable("postId") postId: Long): ResponseEntity<Void> {
        val userSub = token.getSub()
        val postDTO = budgetService.getPost(postId, userSub) ?: return ResponseEntity.notFound().build()
        if (postDTO.locked) {
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
        val postToEdit = budgetService.getPostByUserSubAndId(postId, token.getSub()) ?: return ResponseEntity.notFound().build()
        if (postToEdit.locked) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.editPost(editPostRequest, postToEdit))
    }
}
