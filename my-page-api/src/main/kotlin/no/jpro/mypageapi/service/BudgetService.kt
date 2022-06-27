package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.CreateBudgetDTO
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.JwtUtils
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service

@Service
class BudgetService(
    private val budgetRepository: BudgetRepository,
    private val budgetPostMapper: BudgetPostMapper,
    private val userRepository: UserRepository
) {

    fun getBudgetsToLoggedInUser(id: String): List<BudgetDTO> {
        val user = userRepository.findById(id).get()
        val budgets = user.budgets
        return budgets.map { budgetPostMapper.fromBudgetToBudgetDTO(it) }
    }

    fun createBudget(id: String, createBudgetDTO: CreateBudgetDTO): BudgetDTO {
        val budget = budgetPostMapper.fromCreateBudgetDTOToBudget(createBudgetDTO)
        budget.user = userRepository.findById(id).get()
        budgetRepository.save(budget)
        return budgetPostMapper.fromBudgetToBudgetDTO(budget)

    }
}