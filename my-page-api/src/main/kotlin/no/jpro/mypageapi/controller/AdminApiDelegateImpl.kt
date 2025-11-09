package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.AdminApiDelegate
import no.jpro.mypageapi.model.BudgetSummary
import no.jpro.mypageapi.service.BudgetService
import no.jpro.mypageapi.utils.AuthenticationHelper
import no.jpro.mypageapi.utils.mapper.BudgetMapper
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class AdminApiDelegateImpl(
    private val budgetService: BudgetService,
    private val authHelper: AuthenticationHelper,
    private val budgetMapper: BudgetMapper,
    private val request: Optional<NativeWebRequest>
) : AdminApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getBudgetSummary(): ResponseEntity<List<BudgetSummary>> {
        val summaries = budgetService.getSummary()
        val summaryModels = summaries.map { budgetMapper.toBudgetSummaryModel(it) }
        return ResponseEntity.ok(summaryModels)
    }
}