package no.jpro.mypageapi.controller

import no.jpro.mypageapi.service.SalesPipelineService
import no.jpro.mypageapi.service.SalesPipelineService.HistoricalBenchImportEntry
import no.jpro.mypageapi.service.SalesPipelineService.BenchImportResult
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * Temporary controller for one-time import of historical involuntary bench data.
 * Remove after data has been imported.
 */
@RestController
@RequestMapping("/admin/bench-import")
class BenchDataImportController(
    private val salesPipelineService: SalesPipelineService
) {

    @PostMapping
    fun importBenchData(
        @RequestBody entries: List<HistoricalBenchImportEntry>,
        @RequestParam(defaultValue = "true") dryRun: Boolean
    ): ResponseEntity<BenchImportResult> {
        val result = salesPipelineService.importHistoricalBenchData(entries, dryRun)
        return ResponseEntity.ok(result)
    }
}
