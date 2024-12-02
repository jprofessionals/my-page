package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.JobPostingApiDelegate
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.model.Customer
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.model.JobPostingFile
import no.jpro.mypageapi.model.Tag
import no.jpro.mypageapi.service.JobPostingFilesService
import no.jpro.mypageapi.service.JobPostingService
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import java.time.OffsetDateTime

@Service
class JobPostingController(
    private val jobPostingService: JobPostingService,
    private val jobPostingFilesService: JobPostingFilesService,
) : JobPostingApiDelegate {

    @RequiresAdmin
    override fun createJobPosting(
        jobPosting: JobPosting
    ): ResponseEntity<JobPosting> {
        val entity = jobPostingService.createJobPosting(jobPosting)
        val dto = JobPosting(
            id = entity.id,
            title = entity.title,
            customer = Customer(
                id = entity.customer.id,
                name = entity.customer.name,
                exclusive = entity.customer.exclusive,
            ),
            urgent = entity.urgent,
            deadline = entity.deadline,
            description = entity.description ?: "",
            tags = emptyList(),
            links = emptyList()
        )

        return ResponseEntity
            .created(
                ServletUriComponentsBuilder
                    .fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(dto.id)
                    .toUri()
            )
            .body(dto)
    }

    @RequiresAdmin
    override fun deleteJobPosting(
        id: Long
    ): ResponseEntity<Unit> {
        jobPostingService.deleteJobPosting(id)

        return ResponseEntity.noContent().build()
    }

    @RequiresAdmin
    override fun deleteJobPostingFile(
        jobPostingId: Long,
        fileName: String
    ): ResponseEntity<Unit> {
        jobPostingFilesService.deleteJobPostingFile(
            jobPostingId,
            fileName
        )

        return ResponseEntity.noContent().build()
    }

    override fun getJobPostingCustomers(): ResponseEntity<List<Customer>> {
        val entities = jobPostingService.getJobPostingCustomers()

        val dto = entities
            .map {
                Customer(
                    id = it.id,
                    name = it.name,
                    exclusive = it.exclusive
                )
            }
            .sortedBy {
                it.name
            }

        return ResponseEntity.ok(dto)
    }

    override fun getJobPostingFiles(
        jobPostingId: Long
    ): ResponseEntity<List<JobPostingFile>> {
        val dto = jobPostingFilesService.getJobPostingFiles(jobPostingId)

        return ResponseEntity.ok(dto)
    }

    override fun getJobPostingTags(): ResponseEntity<List<Tag>> {
        val entities = jobPostingService.getJobPostingTags()

        val dto = entities
            .map {
                Tag(
                    id = it.id,
                    name = it.name
                )
            }
            .sortedBy {
                it.name
            }

        return ResponseEntity.ok(dto)
    }

    override fun getJobPostings(
        customers: List<String>?,
        fromDateTime: OffsetDateTime?,
        includeIds: List<String>?,
        tags: List<String>?
    ): ResponseEntity<List<JobPosting>> {
        val entities = jobPostingService.getJobPostings(
            customers ?: emptyList(),
            fromDateTime,
            includeIds ?: emptyList(),
            tags ?: emptyList()
        )

        val dto = entities.map {
            JobPosting(
                id = it.id,
                title = it.title,
                customer = Customer(
                    id = it.customer.id,
                    name = it.customer.name,
                    exclusive = it.customer.exclusive
                ),
                urgent = it.urgent,
                deadline = it.deadline,
                description = it.description ?: "",
                tags = it.tags
                    .map {
                        Tag(
                            id = it.id,
                            name = it.name
                        )
                    },
                links = emptyList()
            )
        }

        return ResponseEntity.ok(dto)
    }

    @RequiresAdmin
    override fun updateJobPosting(
        id: Long,
        jobPosting: JobPosting
    ): ResponseEntity<Unit> {
        if (id != jobPosting.id) {
            return ResponseEntity.badRequest().build()
        }

        jobPostingService.updateJobPosting(jobPosting)

        return ResponseEntity.noContent().build()
    }

    @RequiresAdmin
    override fun uploadJobPostingFile(
        jobPostingId: Long,
        filename: String,
        content: Resource?
    ): ResponseEntity<Unit> {
        if (content == null) {
            return ResponseEntity.badRequest().build()
        }

        jobPostingFilesService.uploadJobPostingFile(
            jobPostingId,
            filename,
            content
        )

        return ResponseEntity
            .created(
                ServletUriComponentsBuilder
                    .fromCurrentRequest()
                    .path("/{name}")
                    .buildAndExpand(filename)
                    .toUri()
            )
            .build()
    }

}