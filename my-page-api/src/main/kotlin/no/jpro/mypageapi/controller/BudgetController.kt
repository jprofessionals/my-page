package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.entity.Budget
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("budgets")
class BudgetController (private val budgetRepository: BudgetRepository, private val budgetPostMapper: BudgetPostMapper) {
    @GetMapping("")
    fun getBudgets(): List<BudgetDTO> {
        val budgets = budgetRepository.findAll()
        return budgets.map {budgetPostMapper.fromBudgetToBudgetDTO(it)}

    }
}