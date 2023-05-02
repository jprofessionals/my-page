package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.dto.JobPostingDTO
import no.jpro.mypageapi.service.JobPostingService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("jobposting")
@SecurityRequirement(name = "Bearer Authentication")
class JobPostingController(
    private val jobPostingService: JobPostingService
) {

    @GetMapping
    @Operation(summary = "Get all job postings")
    @ApiResponse(
        responseCode = "200",
        description = "All job postings",
        content = [Content(schema = Schema(implementation = JobPostingDTO::class))]
    )
    fun getAllJobPostings(): List<JobPostingDTO> {
        return jobPostingService.getAllJobPostings()
    }

}