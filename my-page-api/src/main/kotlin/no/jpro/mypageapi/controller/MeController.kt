package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.JwtUtils
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

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
        userService.getOrCreateUser(jwt)

    @PatchMapping("")
    @Operation(summary = "Update your user with nickname and/or startDate")
    fun updateUser(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody updateUserRequest: UpdateUserDTO
    ): UserDTO =
        userService.updateUser(jwt, updateUserRequest)

    @GetMapping("budgets")
    @Operation(summary = "Get the different budgets that belong to logged in user.")
    fun getBudgets(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): List<BudgetDTO> {
        val userId = JwtUtils.getID(jwt)
        return budgetService.getBudgets(userId)
    }

    @PostMapping("budgets")
    @Operation(summary = "Create a budget for the logged in user")
    fun createBudget(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @RequestBody budgetRequest: CreateBudgetDTO
    ): ResponseEntity<Any> {
        val userId = JwtUtils.getID(jwt)
        val userExists = userService.checkIfUserExists(userId)
        val budgetTypeExists = budgetService.checkIfBudgetTypeExists(budgetRequest.budgetTypeId)
        if (!userExists || !budgetTypeExists) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.createBudget(userId, budgetRequest))
    }

    @GetMapping("budgets/{budgetId}")
    @Operation(summary = "Get budget based on id.")
    fun getBudget(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("budgetId") budgetId: Long
    ): ResponseEntity<Any> {
        val userId = JwtUtils.getID(jwt)
        val budget = budgetService.getBudget(userId, budgetId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(budget)
    }

    @GetMapping("budgets/{budgetId}/posts")
    @Operation(summary = "Get posts for one budget.")
    fun getPosts(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("budgetId") budgetId: Long
    ): List<PostDTO> {
        return budgetService.getPosts(budgetId)
    }

    @GetMapping("budgets/{budgetId}/posts/{postId}")
    @Operation(summary = "Get post based on id.")
    fun getPost(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("budgetId") budgetId: Long,
        @PathVariable("postId") postId: Long
    ): ResponseEntity<Any> {
        val post = budgetService.getPost(budgetId, postId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(post)
    }

    @PostMapping("budgets/{budgetId}/posts")
    @Operation(summary = "Create a new post related to an existing budget.")
    fun createPost(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody postRequest: CreatePostDTO, @PathVariable("budgetId") budgetId: Long,
    ): ResponseEntity<Any> {
        val userId = JwtUtils.getID(jwt)
        val budgetExists = budgetService.checkIfBudgetExists(userId, budgetId)
        if (!budgetExists) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.createPost(postRequest, budgetId, userId))
    }
}
