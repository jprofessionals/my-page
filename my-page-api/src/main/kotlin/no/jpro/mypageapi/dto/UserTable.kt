package no.jpro.mypageapi.dto

import java.util.*

class UserTable {
    var headers: MutableList<Cell> = mutableListOf()
    var rows: MutableList<MutableList<Cell>> = mutableListOf()

    fun initialiseHeaders(budgetTypes: List<BudgetTypeDTO>) {
        headers.add(Cell("Bruker", "BrukerHeader", "BrukerHeader", CellType.USER))
        budgetTypes.forEach {
            headers.add(Cell(it.name, it.name, it, CellType.BALANCE))
            if (it.allowTimeBalance) {
                val headerCopy = it.copy(name = it.name + "(timer)")
                headers.add(Cell(headerCopy.name, headerCopy.name, headerCopy, CellType.HOURS))
            }
        }
    }

    fun addRowForUser(user: UserDTO) {
        val row = mutableListOf(Cell(user.name!!, user.userSub!!, user, CellType.USER))
        headers
            .forEach {
                if (it.cellType == CellType.HOURS) {
                    val budget = getRelevantBudget((it.content as BudgetTypeDTO), user.budgets)
                    if (budget != null) {
                        row.add(
                            Cell(
                                getHoursBalanceForBudget(budget),
                                "hours-${budget.id.toString()}-${user.userSub}",
                                budget,
                                CellType.HOURS
                            )
                        )
                    } else row.add(getEmptyCell(CellType.HOURS))
                }
                else if (it.cellType == CellType.BALANCE) {
                    val budget = getRelevantBudget((it.content as BudgetTypeDTO), user.budgets)
                    if (budget != null) {
                        row.add(
                            Cell(
                                getMoneyBalanceForBudget(budget),
                                "balance-${budget.id.toString()}-${user.userSub}",
                                budget,
                                CellType.BALANCE
                            )
                        )
                    } else row.add(getEmptyCell(CellType.BALANCE))
                }
            }
        rows.add(row)
    }

    fun getRelevantBudget(relevantBudget: BudgetTypeDTO, userBudgets: List<BudgetDTO>?) : BudgetDTO? {
        userBudgets?.forEach {
            if (relevantBudget.name.contains(it.budgetType.name)) {
                return it
            }
        }
        return null
    }

    fun getMoneyBalanceForBudget(budget: BudgetDTO?) : String {
        return "kr ${"%.2f".format(budget?.balance() ?: 0.00)}"
    }

    fun getHoursBalanceForBudget(budget: BudgetDTO?) : String {
        return if (budget != null) {
            "${budget.sumHours()} ${if (budget.sumHours() == 1) "time" else "timer"}"
        } else "0"
    }

    fun getEmptyCell(cellType: CellType) : Cell =
        Cell("-", UUID.randomUUID().toString(), "-", cellType)
}

data class Cell (
    val label: String,
    val key: String,
    val content: Any,
    val cellType: CellType
    )

enum class CellType {
    USER, BALANCE, HOURS
}