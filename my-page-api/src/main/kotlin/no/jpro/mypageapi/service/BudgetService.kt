package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository,
    private val budgetPostMapper: BudgetPostMapper,
    private val postRepository: PostRepository,
    private val budgetTypeService: BudgetTypeService,
    private val budgetTypeMapper: BudgetTypeMapper
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


    class Balance(val year: Int, val budgetTypeId: Long, val balance: Double)

    fun getSummary(): List<BudgetSummary> {
        val hours = getHours()
        val balances = getBalances()

        return postRepository.findAll().filter { it.budget?.budgetType != null }.groupBy { post -> post.date.year }
            .map { postsByYear ->
                BudgetSummary(
                    postsByYear.key,
                    postsByYear.value.groupBy { postsInYear -> postsInYear.budget?.budgetType }
                        .map { postsByBudgetType ->
                            BudgetYearSummary(
                                postsByBudgetType.key?.let { budgetTypeMapper.toBudgetTypeDTO(it) },
                                postsByBudgetType.value.sumOf { postInBudgetType ->
                                    postInBudgetType.amountExMva ?: 0.0
                                },
                                hours.firstOrNull { it.year == postsByYear.key && it.budgetTypeId == postsByBudgetType.key?.id }?.balance
                                    ?: 0.0,
                                balances.firstOrNull { it.year == postsByYear.key && it.budgetTypeId == postsByBudgetType.key?.id }?.balance
                                    ?: 0.0
                            )
                        })
            }
    }

    private fun getBalances(): List<Balance> {
        val budgets = budgetRepository.findBudgetsByUserEnabled(true).filter { it.budgetType != null }

        if (budgets.isEmpty()) {
            return emptyList()
        }

        return (budgets.minOf { it.startDate.year }..LocalDate.now().year).map { year ->
            budgets
                .groupBy { it.budgetType }.map {
                    Balance(year, it.key.id!!, it.value.sumOf { budget ->
                        budget.balance(LocalDate.of(year, 12, 31)).coerceAtLeast(0.0)
                    })
                }
        }.flatten()
    }

    private fun getHours(): List<Balance> {
        val budgets = budgetRepository.findAll().filter { it.budgetType != null }

        if (budgets.isEmpty()) {
            return emptyList()
        }

        return (budgets.minOf { it.startDate.year }..LocalDate.now().year).map { year ->
            budgets
                .groupBy { it.budgetType }.map {
                    Balance(year, it.key.id!!, it.value.sumOf { budget ->
                        budget.hoursInYear(year).toDouble()
                    })
                }
        }.flatten()
    }

}
