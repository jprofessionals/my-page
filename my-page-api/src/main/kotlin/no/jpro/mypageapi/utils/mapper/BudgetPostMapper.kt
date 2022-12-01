package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.entity.Post
import org.springframework.stereotype.Service
@Service
class BudgetPostMapper(private val budgetTypeMapper: BudgetTypeMapper,
                       private val hoursMapper: HoursMapper) {
    fun toPostDTO(post: Post): PostDTO = PostDTO(
        id = post.id,
        date = post.date,
        description = post.description,
        amountIncMva = post.amountIncMva,
        amountExMva = post.amountExMva,
        documentNumber = post.documentNumber,
        dateOfPayment = post.dateOfPayment,
        dateOfDeduction = post.dateOfDeduction,
        expense = post.expense,
        locked = post.locked,
        createdDate = post.createdDate,
        lastModifiedDate = post.lastModifiedDate,
        createdBy = post.createdBy?.name
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
            startAmount = budget.startAmount,
            hours = budget.hours.map { hoursMapper.toHoursDTO(it) }
        )
    }

    fun toPost(createPostDTO: CreatePostDTO): Post = Post(
        date = createPostDTO.date,
        description = createPostDTO.description,
        amountIncMva = createPostDTO.amountIncMva,
        amountExMva = createPostDTO.amountExMva,
        expense = createPostDTO.expense,
    )
}
