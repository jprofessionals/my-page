package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.BudgetType
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.BudgetTypeRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository,
    private val budgetPostMapper: BudgetPostMapper, private val postRepository: PostRepository,
    private val budgetTypeMapper: BudgetTypeMapper, private val budgetTypeRepository: BudgetTypeRepository
) {

    fun getBudgets(userId: String): List<BudgetDTO> {
        val budgets = budgetRepository.findBudgetsByUserId(userId)
        return budgets.map { budgetPostMapper.toBudgetDTO(it) }
    }

    fun createBudget(user: User, createBudgetDTO: CreateBudgetDTO, budgetType: BudgetType): BudgetDTO {
        val budget = budgetPostMapper.toBudget(createBudgetDTO)
        budget.user = user
        budget.budgetType = budgetType
        budgetRepository.save(budget)
        return budgetPostMapper.toBudgetDTO(budget)
    }

    fun getBudgetDTO(userId: String, budgetId: Long): BudgetDTO? {
        val budget = budgetRepository.findBudgetByUserIdAndId(userId, budgetId)
            ?: return null
        return budgetPostMapper.toBudgetDTO(budget)
    }

    fun getBudget(userId: String, budgetId: Long): Budget? {
        return budgetRepository.findBudgetByUserIdAndId(userId, budgetId)
    }

    fun getBudgetType(budgetTypeId: Long): BudgetType? {
        return budgetTypeRepository.findByIdOrNull(budgetTypeId)
    }

    fun createPost(budget: Budget, createPostDTO: CreatePostDTO): PostDTO {
        val post = budgetPostMapper.toPost(createPostDTO)
        post.budget = budget
        postRepository.save(post)
        return budgetPostMapper.toPostDTO(post)
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

    fun createBudgetType(budgetTypeDTO: BudgetTypeDTO): BudgetTypeDTO {
        budgetTypeRepository.save(budgetTypeMapper.toBudgetType(budgetTypeDTO))
        return budgetTypeDTO
    }

    fun getBudgetTypes(): List<BudgetTypeDTO> {
        val budgetTypes = budgetTypeRepository.findAll()
        return budgetTypes.map { budgetTypeMapper.toBudgetTypeDTO(it) }
    }
}
