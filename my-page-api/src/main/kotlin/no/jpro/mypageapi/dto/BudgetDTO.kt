package no.jpro.mypageapi.dto


class BudgetDTO(
    val name: String,
    val ageOfBudgetInMonths: Long,
    var postDTOs: List<PostDTO>,
) {
}