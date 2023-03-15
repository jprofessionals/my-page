package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.dto.UpdatePostDTO
import no.jpro.mypageapi.entity.Budget
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
    private val postRepository: PostRepository
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
}
