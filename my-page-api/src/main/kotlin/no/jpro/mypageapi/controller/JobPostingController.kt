package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.JobPostingApiDelegate
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.model.JobPostingFile
import no.jpro.mypageapi.service.JobPostingFilesService
import no.jpro.mypageapi.service.JobPostingService
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service

@Service
class JobPostingController(
    private val jobPostingService: JobPostingService,
    private val jobPostingFilesService: JobPostingFilesService,
) : JobPostingApiDelegate {

    override fun createJobPosting(
        jobPosting: JobPosting
    ): ResponseEntity<JobPosting> {
        val entity = jobPostingService.createJobPosting(jobPosting)
        val dto = JobPosting(
            id = entity.id,
            title = entity.title,
            customer = entity.customer.name,
            deadline = entity.deadline,
            description = entity.description ?: "",
            tags = emptyList(),
            links = emptyList()
        )

        return ResponseEntity.ok(dto)
    }

    override fun deleteJobPosting(
        id: Long
    ): ResponseEntity<Unit> {
        jobPostingService.deleteJobPosting(id)

        return ResponseEntity.ok().build()
    }

    override fun getJobPostingFiles(
        id: Long
    ): ResponseEntity<List<JobPostingFile>> {
        val dto = jobPostingFilesService.getJobPostingFiles(id)

        return ResponseEntity.ok(dto)
    }

    override fun getJobPostings(): ResponseEntity<List<JobPosting>> {
        val entities = jobPostingService.getJobPostings()

        val dto = entities.map {
            JobPosting(
                id = it.id,
                title = it.title,
                customer = it.customer.name,
                deadline = it.deadline,
                description = it.description ?: "",
                tags = emptyList(),
                links = emptyList()
            )
        }

        return ResponseEntity.ok(dto)
    }

    override fun updateJobPosting(
        id: Long,
        jobPosting: JobPosting
    ): ResponseEntity<JobPosting> {
        if (id != jobPosting.id) {
            return ResponseEntity.badRequest().build<JobPosting>()
        }

        val entity = jobPostingService.updateJobPosting(jobPosting)
        val dto = JobPosting(
            id = entity.id,
            title = entity.title,
            customer = entity.customer.name,
            deadline = entity.deadline,
            description = entity.description ?: "",
            tags = emptyList(),
            links = emptyList()
        )

        return ResponseEntity.ok(dto)
    }

    override fun uploadJobPostingFile(
        id: Long,
        filename: String,
        content: Resource?
    ): ResponseEntity<Unit> {
        if (content == null) {
            return ResponseEntity.badRequest().build()
        }

        jobPostingFilesService.uploadJobPostingFile(
            id,
            filename,
            content
        )

        return ResponseEntity.ok().build()
    }

}