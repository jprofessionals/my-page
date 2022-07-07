package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.BudgetTypeRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository,
    private val budgetPostMapper: BudgetPostMapper, private val postRepository: PostRepository,
    private val budgetTypeMapper: BudgetTypeMapper, private val budgetTypeRepository: BudgetTypeRepository,
    private val userRepository: UserRepository
) {

    fun getBudgets(userId: String): List<BudgetDTO> {
        val budgets = budgetRepository.findBudgetsByUserId(userId)
        return budgets.map { budgetPostMapper.toBudgetDTO(it) }
    }

    fun createBudget(userId: String, budgetRequest: CreateBudgetDTO): BudgetDTO {
        val budget = budgetPostMapper.toBudget(budgetRequest)
        budget.user = userRepository.findById(userId).get()
        budget.budgetType = budgetTypeRepository.findById(budgetRequest.budgetTypeId).get()
        return budgetPostMapper.toBudgetDTO(budgetRepository.save(budget))
    }

    fun getBudget(userId: String, budgetId: Long): BudgetDTO? {
        val budget = budgetRepository.findBudgetByUserIdAndId(userId, budgetId)
            ?: return null
        return budgetPostMapper.toBudgetDTO(budget)
    }

    fun checkIfBudgetExists(userId: String, budgetId: Long): Boolean {
        return budgetRepository.existsBudgetByUserIdAndId(userId, budgetId)
    }


    fun createPost(postRequest: CreatePostDTO, budgetId: Long, userId: String): PostDTO {
        val post = budgetPostMapper.toPost(postRequest)
        val budget = budgetRepository.findBudgetByUserIdAndId(userId, budgetId)
        post.budget = budget
        return budgetPostMapper.toPostDTO(postRepository.save(post))
    }

    fun getPosts(budgetId: Long): List<PostDTO> {
        val posts = postRepository.findPostsByBudgetId(budgetId)
        return posts.map { budgetPostMapper.toPostDTO(it) }
    }

    fun getPost(budgetId: Long, postId: Long): PostDTO? {
        val post = postRepository.findPostByBudgetIdAndId(budgetId, postId)
            ?: return null
        return budgetPostMapper.toPostDTO(post)
    }

    fun createBudgetType(budgetTypeRequest: BudgetTypeDTO): BudgetTypeDTO {
        val savedBudgetType = budgetTypeRepository.save(budgetTypeMapper.toBudgetType(budgetTypeRequest))
        return budgetTypeMapper.toBudgetTypeDTO(savedBudgetType)
    }

    fun getBudgetTypes(): List<BudgetTypeDTO> {
        val budgetTypes = budgetTypeRepository.findAll()
        return budgetTypes.map { budgetTypeMapper.toBudgetTypeDTO(it) }
    }

    fun checkIfBudgetTypeExists(budgetTypeId: Long): Boolean {
        return budgetTypeRepository.existsBudgetTypeById(budgetTypeId)
    }

    fun checkIfDateIsBeforeStartOfBudget(createPostDate: LocalDate, budgetId: Long): Boolean {
        val budgetDate = budgetRepository.findById(budgetId).get().startDate
        return createPostDate.isBefore(budgetDate)
    }
}
