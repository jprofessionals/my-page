package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.Hours
import no.jpro.mypageapi.entity.Post
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.BudgetTypeRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.repository.HoursRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import no.jpro.mypageapi.utils.mapper.HoursMapper
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository, private val budgetPostMapper: BudgetPostMapper,
    private val postRepository: PostRepository,
    private val budgetTypeMapper: BudgetTypeMapper, private val budgetTypeRepository: BudgetTypeRepository,
    private val userRepository: UserRepository,
    private val hoursRepository: HoursRepository, private val hoursMapper: HoursMapper
) {

    fun getBudgets(userSub: String): List<BudgetDTO> {
        val budgets = budgetRepository.findBudgetsByUserSub(userSub)
        return budgets.map { budgetPostMapper.toBudgetDTO(it) }
    }

    fun createBudget(userSub: String, budgetRequest: CreateBudgetDTO): BudgetDTO {
        val budget = budgetPostMapper.toBudget(budgetRequest).copy(
            user = userRepository.findUserBySub(userSub),
            budgetType = budgetTypeRepository.findById(budgetRequest.budgetTypeId).get()
        )
        return budgetPostMapper.toBudgetDTO(budgetRepository.save(budget))
    }

    fun getBudget(userSub: String, budgetId: Long): BudgetDTO? {
        val budget = budgetRepository.findBudgetByUserSubAndId(userSub, budgetId)
            ?: return null
        return budgetPostMapper.toBudgetDTO(budget)
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

    fun getPosts(budgetId: Long): List<PostDTO> {
        val posts = postRepository.findPostsByBudgetId(budgetId)
        return posts.map { budgetPostMapper.toPostDTO(it) }
    }

    fun getPost(budgetId: Long, postId: Long): PostDTO? {
        val post = postRepository.findPostByBudgetIdAndId(budgetId, postId)
            ?: return null
        return budgetPostMapper.toPostDTO(post)
    }

    fun getPost(postId: Long, userSub: String): PostDTO? {
        val post = postRepository.findPostByIdAndBudgetUserSub(postId, userSub)
            ?: return null
        return budgetPostMapper.toPostDTO(post)
    }

    fun getPostByUserSubAndId(postId: Long, userSub: String): Post? {
        return postRepository.findPostByIdAndBudgetUserSub(postId, userSub)
    }

    fun createBudgetType(budgetTypeRequest: BudgetTypeDTO): BudgetTypeDTO {
        val savedBudgetType = budgetTypeRepository.save(budgetTypeMapper.toBudgetType(budgetTypeRequest))
        return budgetTypeMapper.toBudgetTypeDTO(savedBudgetType)
    }

    fun updateBudgetTypeAllowTimeBalance(budgetTypeId: Long, allowTimeBalance: Boolean): BudgetTypeDTO {
        val budgetTypeFromDb = budgetTypeRepository.findById(budgetTypeId).get()
        budgetTypeFromDb.allowTimeBalance = allowTimeBalance
        budgetTypeRepository.save(budgetTypeFromDb)
        return budgetTypeMapper.toBudgetTypeDTO(budgetTypeFromDb)
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

    fun createHours(createHoursDTO: CreateHoursDTO, budgetId: Long, userSub: String): HoursDTO {
        val hours = hoursRepository.save(hoursMapper.toHours(createHoursDTO, budgetId, userSub))
        return hoursMapper.toHoursDTO(hours)
    }

    fun getHours(hoursId: Long): Hours? {
        return hoursRepository.findById(hoursId).get()
    }

    fun deleteHours(hours: Hours) {
        hoursRepository.delete(hours)
    }

    fun getHoursForBudgetId(budgetId: Long): List<HoursDTO>? {
        val hours = hoursRepository.findHoursByBudgetId(budgetId)
        return hours.map( hoursMapper::toHoursDTO)
    }
}
