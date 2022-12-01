package no.jpro.mypageapi.dto

 data class BudgetTypeDTO(
    val id: Long,
    val name: String,
    val rollOver: Boolean,
    val deposit: Double,
    val intervalOfDepositInMonths: Long,
    val startAmount: Double,
    val allowTimeBalance: Boolean = false
)
