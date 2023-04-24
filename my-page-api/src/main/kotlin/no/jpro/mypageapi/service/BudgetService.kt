package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.dto.UpdatePostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository,
    private val budgetPostMapper: BudgetPostMapper,
    private val postRepository: PostRepository,
    private val budgetTypeService: BudgetTypeService
) {

    fun getBudgets(userSub: String): List<BudgetDTO> {
        val budgets = budgetRepository.findBudgetsByUserSub(userSub)
        return budgets.map { budgetPostMapper.toBudgetDTO(it) }
    }

    fun getBudgets(userEmployeeNumber: Int): List<BudgetDTO> {
        val budgets = budgetRepository.findBudgetsByUserEmployeeNumber(userEmployeeNumber)
        return budgets.map { budgetPostMapper.toBudgetDTO(it) }
    }

    fun createPost(postRequest: CreatePostDTO, budget: Budget, createdBy: User): PostDTO {
        val post = budgetPostMapper.toPost(postRequest).copy(
            budget = budget,
            createdBy = createdBy
        )
        return budgetPostMapper.toPostDTO(postRepository.save(post))
    }

    fun deletePost(postId: Long) {
        postRepository.deleteById(postId)
    }

    fun getPost(postId: Long): Post? {
        return postRepository.findPostById(postId)
    }

    fun editPost(editPostRequest: UpdatePostDTO, postToEdit: Post): PostDTO {
        return budgetPostMapper.toPostDTO(
            postRepository.save(
                postToEdit.copy(
                    date = editPostRequest.date ?: postToEdit.date,
                    description = editPostRequest.description ?: postToEdit.description,
                    amountExMva = editPostRequest.amountExMva ?: postToEdit.amountExMva
                )
            )
        )
    }

    fun getBudget(budgetId: Long): Budget? {
        return budgetRepository.findBudgetById(budgetId)
    }

    fun initializeBudgetsForNewEmployee(user: User, budgetStartDate: LocalDate): List<Budget> {
        val defaultBudgetTypes = getDefaultBudgetTypes()

        ensureUserHasNoBudgetsForGivenBudgetTypes(user, defaultBudgetTypes)

        return saveBudgetsFromBudgetTypes(defaultBudgetTypes, user, budgetStartDate)
    }

    private fun saveBudgetsFromBudgetTypes(
        defaultBudgetTypes: List<BudgetType>,
        user: User,
        budgetStartDate: LocalDate
    ): MutableList<Budget> {
        val budgets = createBudgetsFromBudgetTypes(defaultBudgetTypes, user, budgetStartDate)

        return budgetRepository.saveAll(budgets)
    }

    private fun createBudgetsFromBudgetTypes(
        budgetTypes: List<BudgetType>,
        user: User,
        startDate: LocalDate
    ): List<Budget> {
        return budgetTypes.map { budgetType ->
            Budget(
                startAmount = budgetType.startAmount,
                budgetType = budgetType,
                hours = emptyList(),
                posts = emptyList(),
                startDate = startDate,
                user = user
            )
        }
    }

    private fun getDefaultBudgetTypes(): List<BudgetType> {
        return budgetTypeService.getDefaultBudgetTypes()
    }

    private fun ensureUserHasNoBudgetsForGivenBudgetTypes(user: User, budgetTypes: List<BudgetType>) {
        val email = user.email
            ?: throw IllegalArgumentException("Cannot check budgets for user with no email")
        val hasBudgets = budgetRepository.findBudgetsByUserEmailAndBudgetTypeIn(email, budgetTypes)
            .any()

        if (hasBudgets) {
            throw IllegalArgumentException("User already has budgets for default budget types")
        }
    }

}
