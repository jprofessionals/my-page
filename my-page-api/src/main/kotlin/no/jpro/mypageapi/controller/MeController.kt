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
import org.springframework.http.HttpStatus
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
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserDTO::class))]
    )
    fun updateUser(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody updateUserRequest: UpdateUserDTO
    ): ResponseEntity<UserDTO> {
        if (!userService.checkIfUserExists(JwtUtils.getSub(jwt))) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(userService.updateUser(jwt, updateUserRequest))
    }

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
    fun getBudgets(@Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt): List<BudgetDTO> {
        val userSub = JwtUtils.getSub(jwt)
        return budgetService.getBudgets(userSub)
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
        val userSub = JwtUtils.getSub(jwt)
        if (!userService.checkIfUserExists(userSub) || !budgetService.checkIfBudgetTypeExists(budgetRequest.budgetTypeId)) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.createBudget(userSub, budgetRequest))
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
        val userSub = JwtUtils.getSub(jwt)
        val budget = budgetService.getBudget(userSub, budgetId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(budget)
    }

    @GetMapping("budgets/{budgetId}/posts")
    @Operation(summary = "Get posts for one budget.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = PostDTO::class)
            )
        )]
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
        val userSub = JwtUtils.getSub(jwt)
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
    fun deletePost(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("postId") postId: Long,
    ): ResponseEntity<Void> {
        val userSub = JwtUtils.getSub(jwt)
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
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("postId") postId: Long,
        @Valid @RequestBody editPostRequest: UpdatePostDTO,
    ): ResponseEntity<PostDTO> {
        val userSub = JwtUtils.getSub(jwt)
        val postToEdit = budgetService.getPostByUserSubAndId(postId, userSub) ?: return ResponseEntity.notFound().build()
        if (postToEdit.locked) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.editPost(editPostRequest, postToEdit))

    }

    @PostMapping("budgets/{budgetId}/hours")
    @Operation(summary = "Create a new hours entry related to an existing budget.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = HoursDTO::class))]
    )
    fun createHours(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody postRequest: CreateHoursDTO, @PathVariable("budgetId") budgetId: Long,
    ): ResponseEntity<HoursDTO> {
        val userSub = JwtUtils.getSub(jwt)
        if(!userService.checkIfUserExists(userSub)) {
            return ResponseEntity.badRequest().build()
        }
        if (!budgetService.checkIfBudgetExists(userSub, budgetId)) {
            return ResponseEntity.badRequest().build()
        }
        return ResponseEntity.ok(budgetService.createHours(postRequest, budgetId, userSub))
    }

    @DeleteMapping("hours/{hoursId}")
    @Operation(summary = "Delete an hours entry based on hoursID")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    fun deleteHours(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("hoursId") hoursId: Long,
    ): ResponseEntity<Void> {
        val hours = budgetService.getHours(hoursId) ?: return ResponseEntity.notFound().build()
        budgetService.deleteHours(hours)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("budget/{budgetId}/hours")
    @Operation(summary = "Get hours based on budgetId.")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = HoursDTO::class))]
    )
    fun getHoursForBudget(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @PathVariable("budgetId") budgetId: Long
    ): ResponseEntity<List<HoursDTO>> {
        val hours = budgetService.getHoursForBudgetId(budgetId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(hours)
    }
}
