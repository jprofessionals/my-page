package no.jpro.mypageapi.dto

class CreateBudgetTypeDTO(
    val name: String,
    val rollOver: Boolean,
    val deposit: Double,
    val intervalOfDepositInMonths: Long,
    val startAmount: Double,
) {

}
