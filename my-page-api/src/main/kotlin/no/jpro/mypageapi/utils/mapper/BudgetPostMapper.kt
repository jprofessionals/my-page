package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreateBudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.repository.BudgetTypeRepository
import org.springframework.stereotype.Service

@Service
class BudgetPostMapper(private val budgetTypeMapper: BudgetTypeMapper, private val budgetTypeRepository: BudgetTypeRepository) {
    fun toPostDTO(post: Post): PostDTO = PostDTO(
        id = post.id,
        date = post.date,
        description = post.description,
        amount = post.amount,
        expense = post.expense,
        locked = post.locked,
    )

    fun toBudgetDTO(budget: Budget): BudgetDTO {
        val posts = budget.posts
        val postDTOs = posts.map { toPostDTO(it) }
        val budgetType = budget.budgetType
        val responseBudgetType = budgetTypeMapper.toBudgetTypeDTO(budgetType)
        return BudgetDTO(
            id = budget.id,
            posts = postDTOs,
            budgetType = responseBudgetType,
            startDate = budget.startDate,
            startAmount = budget.startAmount
        )
    }

    fun toBudget(createBudgetDTO: CreateBudgetDTO): Budget = Budget(
        posts = listOf(),
        budgetType = budgetTypeRepository.findById(createBudgetDTO.budgetTypeId).get(),
        startDate = createBudgetDTO.startDate,
        startAmount = createBudgetDTO.startAmount
    )

    fun toPost(createPostDTO: CreatePostDTO): Post = Post(
        date = createPostDTO.date,
        description = createPostDTO.description,
        amount = createPostDTO.amount,
        expense = createPostDTO.expense,
    )
}
