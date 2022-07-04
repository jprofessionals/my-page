package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreateBudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.Post
import org.springframework.stereotype.Service

@Service
class BudgetPostMapper() {
    fun toPostDTO(post: Post): PostDTO = PostDTO(
        date = post.date,
        description = post.description,
        amount = post.amount,
        expense = post.expense,
    )

    fun toBudgetDTO(budget: Budget): BudgetDTO {
        val posts = budget.posts
        val postDTOs = posts.map { toPostDTO(it) }
        return BudgetDTO(
            name = budget.name,
            id = budget.id,
            ageOfBudgetInMonths = budget.ageOfBudgetInMonths,
            posts = postDTOs,
            budgetTypeId = budget.budgetType?.id
        )
    }

    fun toBudget(createBudgetDTO: CreateBudgetDTO): Budget = Budget(
        name = createBudgetDTO.name,
        ageOfBudgetInMonths = createBudgetDTO.ageOfBudgetInMonths,
        posts = listOf()
    )

    fun toPost(createPostDTO: CreatePostDTO): Post = Post(
        date = createPostDTO.date,
        description = createPostDTO.description,
        amount = createPostDTO.amount,
        expense = createPostDTO.expense,
    )


}
