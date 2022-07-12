package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.ArraySchema
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
    private val budgetService: BudgetService,
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
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserDTO::class))]
    )
    fun updateUser(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody updateUserRequest: UpdateUserDTO
    ): UserDTO =
        userService.updateUser(jwt, updateUserRequest)

    @GetMapping("budgets")
    @Operation(summary = "Get the different budgets that belong to logged in user.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", array = ArraySchema(
            schema = Schema(implementation = BudgetDTO::class)
        ))]
    )
    fun getBudgets(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): List<BudgetDTO> {
        val userId = JwtUtils.getID(jwt)
        return budgetService.getBudgets(userId)
    }

    @PostMapping("budgets")
    @Operation(summary = "Create a budget for the logged in user")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = BudgetDTO::class))]
    )
    fun createBudget(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @RequestBody budgetRequest: CreateBudgetDTO
    ): ResponseEntity<BudgetDTO> {
        val userId = JwtUtils.getID(jwt)
        if (!userService.checkIfUserExists(userId) || !budgetService.checkIfBudgetTypeExists(budgetRequest.budgetTypeId)) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.createBudget(userId, budgetRequest))
    }

    @GetMapping("budgets/{budgetId}")
    @Operation(summary = "Get budget based on id.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = BudgetDTO::class))]
    )
    fun getBudget(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("budgetId") budgetId: Long
    ): ResponseEntity<BudgetDTO> {
        val userId = JwtUtils.getID(jwt)
        val budget = budgetService.getBudget(userId, budgetId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(budget)
    }

    @GetMapping("budgets/{budgetId}/posts")
    @Operation(summary = "Get posts for one budget.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", array = ArraySchema(
            schema = Schema(implementation = PostDTO::class)
        ))]
    )
    fun getPosts(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("budgetId") budgetId: Long
    ): List<PostDTO> {
        return budgetService.getPosts(budgetId)
    }

    @GetMapping("budgets/{budgetId}/posts/{postId}")
    @Operation(summary = "Get post based on id.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = PostDTO::class))]
    )
    fun getPost(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("budgetId") budgetId: Long,
        @PathVariable("postId") postId: Long
    ): ResponseEntity<PostDTO> {
        val post = budgetService.getPost(budgetId, postId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(post)
    }

    @PostMapping("budgets/{budgetId}/posts")
    @Operation(summary = "Create a new post related to an existing budget.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = PostDTO::class))]
    )
    fun createPost(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody postRequest: CreatePostDTO, @PathVariable("budgetId") budgetId: Long,
    ): ResponseEntity<PostDTO> {
        val userId = JwtUtils.getID(jwt)
        if (!budgetService.checkIfBudgetExists(userId, budgetId)) {
            return ResponseEntity.badRequest().build()
        }
        if (budgetService.checkIfDateIsBeforeStartOfBudget(postRequest.date, budgetId)) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.createPost(postRequest, budgetId, userId))
    }
    @DeleteMapping("budgets/{budgetId}/posts/{postId}")
    @Operation(summary = "Delete a post from based on PostID, BudgetID and UserID.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = PostDTO::class))]
    )
    fun deletePost(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
         @PathVariable("budgetId") budgetId: Long, @PathVariable("postId") postId: Long,
    ): ResponseEntity<Unit> {
        val userId = JwtUtils.getID(jwt)
        val postDTO = budgetService.getPost(budgetId,postId)
        if (!budgetService.checkIfBudgetExists(userId, budgetId)) {
            return ResponseEntity.badRequest().build()
        }
        if (postDTO == null || postDTO.locked){
            return ResponseEntity.badRequest().build()
    }
    return ResponseEntity.ok(budgetService.deletePost(budgetId, postId))

    }
}
