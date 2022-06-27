package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreateBudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.JwtUtils
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service

@Service
class BudgetPostMapper(private val budgetRepository: BudgetRepository, private val userRepository: UserRepository) {
    fun fromPostToPostDTO(post: Post): PostDTO = PostDTO(
        date = post.date,
        description = post.description,
        amount = post.amount,
        expense = post.expense,
    )

    fun fromBudgetToBudgetDTO(budget: Budget): BudgetDTO {
        val posts = budget.posts
        val postDTOs = posts.map { fromPostToPostDTO(it) }
        return BudgetDTO(
            name = budget.name,
            ageOfBudgetInMonths = budget.ageOfBudgetInMonths,
            postDTOs = postDTOs
        )
    }

    fun fromCreateBudgetDTOAndJwtToBudget(jwt: Jwt, createBudgetDTO: CreateBudgetDTO): Budget = Budget(
        name = createBudgetDTO.name,
        ageOfBudgetInMonths = createBudgetDTO.ageOfBudgetInMonths,
        posts = listOf(),
        user = userRepository.findById(JwtUtils.getID(jwt)).get()
    )

    fun fromCreatePostDTOToPost(createPostDTO: CreatePostDTO): Post = Post(
        date = createPostDTO.date,
        description = createPostDTO.description,
        amount = createPostDTO.amount,
        expense = createPostDTO.expense,
        budget = budgetRepository.findById(createPostDTO.budgetId).get()
    )


}
