package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.JobPostingApiDelegate
import no.jpro.mypageapi.config.RequiresAdmin
import org.slf4j.LoggerFactory
import no.jpro.mypageapi.model.CategorizationStatus
import no.jpro.mypageapi.model.Customer
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.model.JobPostingFile
import no.jpro.mypageapi.model.JobPostingSource
import no.jpro.mypageapi.model.JobPostingStatistics
import no.jpro.mypageapi.model.JobPostingStatisticsMonthlyDataInner
import no.jpro.mypageapi.model.Tag
import no.jpro.mypageapi.model.TechCategory
import no.jpro.mypageapi.service.JobPostingCategorizationService
import no.jpro.mypageapi.service.JobPostingFilesService
import no.jpro.mypageapi.service.JobPostingService
import no.jpro.mypageapi.service.JobPostingStatisticsService
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import java.net.URI
import java.time.OffsetDateTime

@Service
class JobPostingController(
    private val jobPostingService: JobPostingService,
    private val jobPostingFilesService: JobPostingFilesService,
    private val jobPostingStatisticsService: JobPostingStatisticsService,
    private val jobPostingCategorizationService: JobPostingCategorizationService,
) : JobPostingApiDelegate {

    private val logger = LoggerFactory.getLogger(JobPostingController::class.java)

    @RequiresAdmin
    override fun createJobPosting(
        notify: Boolean,
        jobPosting: JobPosting
    ): ResponseEntity<JobPosting> {
        val entity = jobPostingService.createJobPosting(notify, jobPosting)
        val dto = JobPosting(
            id = entity.id,
            title = entity.title,
            customer = Customer(
                id = entity.customer.id,
                name = entity.customer.name,
                exclusive = entity.customer.exclusive,
            ),
            urgent = entity.urgent,
            hidden = entity.hidden,
            deadline = entity.deadline,
            description = entity.description ?: "",
            tags = emptyList(),
            links = emptyList(),
            createdDate = entity.createdDate,
            updatedAt = entity.updatedAt,
            source = entity.source?.let { JobPostingSource.valueOf(it.name) },
            estimatedHourlyRate = entity.estimatedHourlyRate?.toDouble(),
            location = entity.location,
            intermediary = entity.intermediary
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
        hidden: Boolean?,
        includeIds: List<String>?,
        tags: List<String>?
    ): ResponseEntity<List<JobPosting>> {
        val entities = jobPostingService.getJobPostings(
            customers ?: emptyList(),
            fromDateTime,
            hidden,
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
                hidden = it.hidden,
                deadline = it.deadline,
                description = it.description ?: "",
                tags = it.tags
                    .map { tag ->
                        Tag(
                            id = tag.id,
                            name = tag.name
                        )
                    },
                links = it.links
                    .map { link ->
                        URI(link)
                    },
                createdDate = it.createdDate,
                updatedAt = it.updatedAt,
                source = it.source?.let { src -> JobPostingSource.valueOf(src.name) },
                estimatedHourlyRate = it.estimatedHourlyRate?.toDouble(),
                location = it.location,
                intermediary = it.intermediary
            )
        }
        return ResponseEntity.ok(dto)
    }

    @RequiresAdmin
    override fun notifyJobPosting(
        id: Long
    ): ResponseEntity<Unit> {
        jobPostingService.notifyJobPosting(id)
        return ResponseEntity.noContent().build()
    }

    @RequiresAdmin
    override fun updateJobPosting(
        id: Long,
        jobPosting: JobPosting,
        updateMessage: String?
    ): ResponseEntity<Unit> {
        if (id != jobPosting.id) {
            return ResponseEntity.badRequest().build()
        }

        jobPostingService.updateJobPosting(jobPosting, updateMessage)

        return ResponseEntity.noContent().build()
    }

    @RequiresAdmin
    override fun uploadJobPostingFile(
        jobPostingId: Long,
        filename: String,
        content: MultipartFile
    ): ResponseEntity<Unit> {

        jobPostingFilesService.uploadJobPostingFile(
            jobPostingId,
            filename,
            content.resource
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

    override fun getJobPostingStatistics(): ResponseEntity<JobPostingStatistics> {
        val stats = jobPostingStatisticsService.getStatistics()

        val dto = JobPostingStatistics(
            monthlyData = stats.monthlyData.map { monthly ->
                JobPostingStatisticsMonthlyDataInner(
                    month = monthly.month,
                    javaKotlin = monthly.javaKotlin,
                    dotnet = monthly.dotnet,
                    dataAnalytics = monthly.dataAnalytics,
                    frontend = monthly.frontend,
                    other = monthly.other
                )
            },
            uncategorizedCount = stats.uncategorizedCount,
            totalCount = stats.totalCount,
            missingDateCount = stats.missingDateCount,
            oldestDate = stats.oldestDate,
            newestDate = stats.newestDate
        )

        return ResponseEntity.ok(dto)
    }

    @RequiresAdmin
    override fun categorizeJobPostings(): ResponseEntity<CategorizationStatus> {
        val result = jobPostingCategorizationService.startCategorization()

        return ResponseEntity.ok(CategorizationStatus(
            isRunning = result["isRunning"] as Boolean,
            progress = result["progress"] as Int,
            total = result["total"] as Int,
            started = result["started"] as? Boolean,
            message = result["message"] as? String
        ))
    }

    override fun getCategorizationStatus(): ResponseEntity<CategorizationStatus> {
        val status = jobPostingCategorizationService.getStatus()

        return ResponseEntity.ok(CategorizationStatus(
            isRunning = status["isRunning"] as Boolean,
            progress = status["progress"] as Int,
            total = status["total"] as Int
        ))
    }

    override fun getJobPostingsByCategory(
        category: TechCategory,
        month: String
    ): ResponseEntity<List<JobPosting>> {
        val entityCategory = no.jpro.mypageapi.entity.TechCategory.valueOf(category.value)
        val entities = jobPostingStatisticsService.getJobPostingsByCategory(entityCategory, month)

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
                hidden = it.hidden,
                deadline = it.deadline,
                description = it.description ?: "",
                tags = it.tags.map { tag ->
                    Tag(id = tag.id, name = tag.name)
                },
                links = it.links.map { link -> URI(link) },
                createdDate = it.createdDate,
                updatedAt = it.updatedAt,
                source = it.source?.let { src -> JobPostingSource.valueOf(src.name) },
                estimatedHourlyRate = it.estimatedHourlyRate?.toDouble(),
                location = it.location,
                intermediary = it.intermediary
            )
        }
        return ResponseEntity.ok(dto)
    }

    @RequiresAdmin
    override fun recategorizeAllJobPostings(): ResponseEntity<CategorizationStatus> {
        logger.info("=== RECATEGORIZE ALL: Starting ===")

        // First reset all categories (in separate transaction via proxy)
        val count = jobPostingCategorizationService.resetAllCategories()
        logger.info("=== RECATEGORIZE ALL: Reset $count job postings ===")

        if (count == 0) {
            return ResponseEntity.ok(CategorizationStatus(
                isRunning = false,
                progress = 0,
                total = 0,
                started = false,
                message = "Ingen utlysninger funnet"
            ))
        }

        // Then start categorization (will find all as uncategorized now)
        val result = jobPostingCategorizationService.startCategorization()
        val foundTotal = result["total"] as Int
        logger.info("=== RECATEGORIZE ALL: startCategorization found $foundTotal uncategorized (expected $count) ===")

        if (foundTotal != count) {
            logger.warn("=== DISCREPANCY: Reset $count but only found $foundTotal uncategorized! ===")
        }

        return ResponseEntity.ok(CategorizationStatus(
            isRunning = result["isRunning"] as Boolean,
            progress = result["progress"] as Int,
            total = foundTotal,
            started = result["started"] as? Boolean,
            message = "Startet rekategorisering av $count utlysninger"
        ))
    }

}
