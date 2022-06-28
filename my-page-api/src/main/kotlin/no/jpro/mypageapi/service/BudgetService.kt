package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreateBudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.stereotype.Service

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository,
    private val budgetPostMapper: BudgetPostMapper, private val postRepository: PostRepository
) {

    fun getBudgets(userId: String): List<BudgetDTO> {
        val budgets = budgetRepository.findBudgetsByUserId(userId)
        return budgets.map { budgetPostMapper.toBudgetDTO(it) }
    }

    fun createBudget(user: User, createBudgetDTO: CreateBudgetDTO): BudgetDTO {
        val budget = budgetPostMapper.toBudget(createBudgetDTO)
        budget.user = user
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
}
