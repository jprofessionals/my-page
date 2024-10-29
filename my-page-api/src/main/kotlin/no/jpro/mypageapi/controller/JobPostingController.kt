package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.JobPostingApiDelegate
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.model.JobPostingResponse
import no.jpro.mypageapi.service.JobPostingService
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service

@Service
class JobPostingController(
    private val jobPostingService: JobPostingService,
) : JobPostingApiDelegate {

    override fun createJobPosting(
        jobPosting: JobPosting
    ): ResponseEntity<JobPostingResponse> {
        val entity = jobPostingService.createJobPosting(jobPosting)
        val dto = JobPostingResponse(
            entity.title,
            entity.customer.name,
            entity.deadline,
            entity.description ?: "",
            emptyList(),
            emptyList(),
            emptyList(),
            entity.id.toString()
        )

        return ResponseEntity.ok(dto)
    }

    override fun getJobPostings(): ResponseEntity<List<JobPostingResponse>> {
        val entities = jobPostingService.getJobPostings()

        val dto = entities.map {
            JobPostingResponse(
                it.title,
                it.customer.name,
                it.deadline,
                it.description ?: "",
                emptyList(),
                emptyList(),
                emptyList(),
                it.id.toString()
            )
        }

        return ResponseEntity.ok(dto)
    }

}