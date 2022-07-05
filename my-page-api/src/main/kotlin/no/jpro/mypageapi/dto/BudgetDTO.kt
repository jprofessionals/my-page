package no.jpro.mypageapi.dto

import no.jpro.mypageapi.entity.BudgetType


class BudgetDTO(
    val name: String,
    val id: Long?,
    var ageOfBudgetInMonths: Long,
    var posts: List<PostDTO>,
    var budgetType: BudgetTypeDTO

) {
}
