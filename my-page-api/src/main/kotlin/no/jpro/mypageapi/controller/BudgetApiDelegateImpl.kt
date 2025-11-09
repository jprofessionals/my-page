package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.BudgetApiDelegate
import no.jpro.mypageapi.extensions.getSub
import no.jpro.mypageapi.model.Budget
import no.jpro.mypageapi.model.BudgetDetail
import no.jpro.mypageapi.model.CreatePost
import no.jpro.mypageapi.model.Post
import no.jpro.mypageapi.model.UpdatePost
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.service.UserService
import no.jpro.mypageapi.utils.AuthenticationHelper
import no.jpro.mypageapi.utils.mapper.BudgetMapper
import no.jpro.mypageapi.utils.mapper.PostMapper
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class BudgetApiDelegateImpl(
    private val budgetRepository: BudgetRepository,
    private val budgetService: BudgetService,
    private val userService: UserService,
    private val budgetMapper: BudgetMapper,
    private val postMapper: PostMapper,
    private val authHelper: AuthenticationHelper,
    private val request: Optional<NativeWebRequest>
) : BudgetApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getMyBudgets(): ResponseEntity<List<Budget>> {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication is JwtAuthenticationToken) {
            val sub = authentication.getSub()
            val budgets = budgetRepository.findBudgetsByUserSub(sub)
            val budgetModels = budgets.map { budgetMapper.toBudgetModel(it) }
            return ResponseEntity.ok(budgetModels)
        }
        return ResponseEntity.status(401).build()
    }

    override fun getBudgetsForEmployee(employeeNumber: Int): ResponseEntity<List<BudgetDetail>> {
        val budgets = budgetService.getBudgets(employeeNumber)
        val budgetDetails = budgets.map { budgetDTO ->
            val budget = budgetRepository.findById(budgetDTO.id!!).orElse(null)
            budgetMapper.toBudgetDetailModel(budget)
        }
        return ResponseEntity.ok(budgetDetails)
    }

    override fun createBudgetPost(budgetId: Long, createPost: CreatePost): ResponseEntity<Post> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val user = authHelper.getCurrentUser(testUserId) ?: return ResponseEntity.status(401).build()

        val budget = budgetService.getBudget(budgetId) ?: return ResponseEntity.badRequest().build()

        // Check permission
        if (budget.user?.id != user.id && !user.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        val createPostDTO = postMapper.toCreatePostDTO(createPost)
        val createdPostDTO = budgetService.createPost(createPostDTO, budget, user)
        val postModel = postMapper.toPostModel(createdPostDTO)
        return ResponseEntity.status(HttpStatus.CREATED).body(postModel)
    }

    override fun deleteBudgetPost(postId: Long): ResponseEntity<Unit> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val user = authHelper.getCurrentUser(testUserId) ?: return ResponseEntity.status(401).build()

        val postToDelete = budgetService.getPost(postId) ?: return ResponseEntity.notFound().build()
        val budget = postToDelete.budget ?: return ResponseEntity.badRequest().build()

        // Check permission
        if (budget.user?.id != user.id && !user.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        if (postToDelete.locked) {
            return ResponseEntity.badRequest().build()
        }

        budgetService.deletePost(postId)
        return ResponseEntity.noContent().build()
    }

    override fun updateBudgetPost(postId: Long, updatePost: UpdatePost): ResponseEntity<Post> {
        val testUserId = getRequest().map { it.getHeader("X-Test-User-Id") }.orElse(null)
        val user = authHelper.getCurrentUser(testUserId) ?: return ResponseEntity.status(401).build()

        val postToEdit = budgetService.getPost(postId) ?: return ResponseEntity.notFound().build()
        val budget = postToEdit.budget ?: return ResponseEntity.badRequest().build()

        // Check permission
        if (budget.user?.id != user.id && !user.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        if (postToEdit.locked) {
            return ResponseEntity.badRequest().build()
        }

        val updatePostDTO = postMapper.toUpdatePostDTO(updatePost)
        val updatedPostDTO = budgetService.editPost(updatePostDTO, postToEdit)
        val postModel = postMapper.toPostModel(updatedPostDTO)
        return ResponseEntity.ok(postModel)
    }
}