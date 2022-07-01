package no.jpro.mypageapi.dto


class BudgetDTO(
    val name: String,
    val id: Long?,
    var ageOfBudgetInMonths: Long,
    var posts: List<PostDTO>,
) {
}
