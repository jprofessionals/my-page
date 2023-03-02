package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository, private val budgetPostMapper: BudgetPostMapper,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository,
) {

    fun getBudgets(userSub: String): List<BudgetDTO> {
        val budgets = budgetRepository.findBudgetsByUserSub(userSub)
        return budgets.map { budgetPostMapper.toBudgetDTO(it) }
    }

    fun checkIfBudgetExists(userSub: String, budgetId: Long): Boolean {
        return budgetRepository.existsBudgetByUserSubAndId(userSub, budgetId)
    }

    fun createPost(postRequest: CreatePostDTO, budgetId: Long, userSub: String): PostDTO {
        val budget = budgetRepository.findBudgetByUserSubAndId(userSub, budgetId)
        val createdBy = userRepository.findUserBySub(userSub)
        val post = budgetPostMapper.toPost(postRequest).copy(
            budget = budget,
            createdBy = createdBy
        )
        return budgetPostMapper.toPostDTO(postRepository.save(post))
    }

    fun deletePost(postId: Long) {
        postRepository.deleteById(postId)
    }

    fun getPost(postId: Long, userSub: String): PostDTO? {
        val post = postRepository.findPostByIdAndBudgetUserSub(postId, userSub)
            ?: return null
        return budgetPostMapper.toPostDTO(post)
    }

    fun getPostByUserSubAndId(postId: Long, userSub: String): Post? {
        return postRepository.findPostByIdAndBudgetUserSub(postId, userSub)
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
}
