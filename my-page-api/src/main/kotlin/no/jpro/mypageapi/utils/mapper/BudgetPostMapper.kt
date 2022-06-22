package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.repository.BudgetRepository
import org.springframework.stereotype.Service

@Service
class BudgetPostMapper(private val budgetRepository: BudgetRepository) {
    fun fromPostToPostDTO(post: Post): PostDTO = PostDTO(
        post.date,
        post.description,
        post.amount,
        post.expense,
    )

    fun fromBudgetToBudgetDTO(budget: Budget): BudgetDTO {
        val posts = budget.posts
        val postDTOs = posts.map { fromPostToPostDTO(it) }
        return BudgetDTO(
            budget.name,
            budget.ageOfBudgetInMonths,
            postDTOs
        )
    }

        fun fromCreatePostDTOToPost(createPostDTO: CreatePostDTO): Post = Post(
            createPostDTO.id,
            createPostDTO.date,
            createPostDTO.description,
            createPostDTO.amount,
            createPostDTO.expense,
            budgetRepository.findById(createPostDTO.budgetId).get()
        )


    }
