package no.jpro.mypageapi.dto


class BudgetDTO(
    val name: String,
    var ageOfBudgetInMonths: Long,
    var posts: List<PostDTO>,
) {
}