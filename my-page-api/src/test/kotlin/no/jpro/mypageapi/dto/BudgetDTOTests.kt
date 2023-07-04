package no.jpro.mypageapi.dto

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import java.time.LocalDate


class BudgetDTOTests {


    private fun createBudget(): BudgetDTO {
        return BudgetDTO(id = 1,
                        posts = listOf(PostDTO(id = 1,
                                               date = LocalDate.now(),
                                               description = "description", amountIncMva = 125.0, amountExMva = 100.0, documentNumber = null, dateOfPayment = null,
                                               dateOfDeduction = null, expense = true, locked = true,
                                               createdDate = null, lastModifiedDate = null, createdBy = null),
                                       PostDTO(id = 2,
                                               date = LocalDate.now(),
                                               description = "description", amountIncMva = 250.0, amountExMva = 200.0, documentNumber = null, dateOfPayment = null,
                                               dateOfDeduction = null, expense = true, locked = true,
                                               createdDate = null, lastModifiedDate = null, createdBy = null)),
                        budgetType = BudgetTypeDTO(id = 1,
                                                   name = "name",
                                                   rollOver = true,
                                                   deposit = 100.0,
                                                   intervalOfDepositInMonths = 10,
                                                   startAmount = 5.0),
                        startDate = LocalDate.now(),
                        startAmount = 11.0,
                        hours = listOf(HoursDTO(id = 1,
                                                hours = 24,
                                                createdBy = "createdBy",
                                                dateOfUsage = LocalDate.now()),
                                       HoursDTO(id = 2,
                                                hours = 23,
                                                createdBy = "createdBy",
                                                dateOfUsage = LocalDate.now())))
    }

    @Test
    fun testSumPosts() {
        val budget = createBudget()
        Assertions.assertEquals(300.0, budget.sumPosts())
    }

}