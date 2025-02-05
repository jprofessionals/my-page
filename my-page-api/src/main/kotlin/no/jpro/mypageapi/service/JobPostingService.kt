package no.jpro.mypageapi.service

import jakarta.persistence.EntityNotFoundException
import no.jpro.mypageapi.entity.Customer
import no.jpro.mypageapi.entity.NotificationTask
import no.jpro.mypageapi.entity.Tag
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.JobPostingRepository
import no.jpro.mypageapi.repository.NotificationTaskRepository
import no.jpro.mypageapi.repository.TagRepository
import no.jpro.mypageapi.service.slack.SlackService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Service
class JobPostingService(
    private val customerRepository: CustomerRepository,
    private val tagRepository: TagRepository,
    private val jobPostingRepository: JobPostingRepository,
    private val notificationTaskRepository: NotificationTaskRepository,
    private val slackService: SlackService,
) {

    @Transactional
    fun createJobPosting(
        notify: Boolean,
        jobPosting: JobPosting
    ): no.jpro.mypageapi.entity.JobPosting {
        val customerEntity = customerRepository.findByName(jobPosting.customer.name) ?: customerRepository.save(
            Customer(
                name = jobPosting.customer.name
            )
        )

        val tagEntities = jobPosting
            .tags
            .map {
                tagRepository.findByName(it.name) ?: tagRepository.save(
                    Tag(
                        name = it.name
                    )
                )
            }

        val jobPostingToPersist = no.jpro.mypageapi.entity.JobPosting(
            title = jobPosting.title,
            customer = customerEntity,
            description = jobPosting.description,
            urgent = jobPosting.urgent,
            hidden = jobPosting.hidden,
            deadline = jobPosting.deadline,
            tags = tagEntities,
            links = jobPosting.links.map { it.toString() }
        )

        val newJobPosting = jobPostingRepository.save(jobPostingToPersist)
        notificationTaskRepository.save(NotificationTask(jobPostingId = newJobPosting.id))

        if (notify) {
            slackService.postJobPosting(
                "utlysninger",
                newJobPosting,
            )
        }

        return newJobPosting
    }

    fun deleteJobPosting(
        id: Long
    ) {
        jobPostingRepository.deleteById(id)
    }

    fun getJobPostingTags(): List<no.jpro.mypageapi.entity.Tag> {
        return tagRepository.findAll()
    }

    fun getJobPostings(
        customers: List<String>,
        fromDateTime: OffsetDateTime?,
        hidden: Boolean?,
        includeIds: List<String>,
        tags: List<String>
    ): List<no.jpro.mypageapi.entity.JobPosting> {
        return jobPostingRepository.findAllWithFilters(
            customers,
            fromDateTime,
            hidden,
            includeIds,
            tags
        )
    }

    fun getJobPostingCustomers(): List<Customer> {
        return customerRepository.findAll()
    }

    @Transactional
    fun updateJobPosting(
        jobPosting: JobPosting,
        updateMessage: String?
    ) {
        val existingJobPosting = jobPostingRepository.findById(jobPosting.id)
            .orElseThrow {
                EntityNotFoundException("Job posting with id ${jobPosting.id} not found")
            }

        val customerEntity = customerRepository.findByName(jobPosting.customer.name) ?: customerRepository.save(
            Customer(
                name = jobPosting.customer.name
            )
        )

        val tagEntities = jobPosting
            .tags
            .map {
                tagRepository.findByName(it.name) ?: tagRepository.save(
                    Tag(
                        name = it.name
                    )
                )
            }

        val updatedJobPosting = jobPostingRepository.save(
            existingJobPosting.apply {
                title = jobPosting.title
                customer = customerEntity
                description = jobPosting.description
                urgent = jobPosting.urgent
                hidden = jobPosting.hidden
                deadline = jobPosting.deadline
                tags = tagEntities
                links = jobPosting.links.map { it.toString() }
            }
        )

        if (updateMessage != null) {
            slackService.postJobPostingUpdate(
                "utlysninger",
                updatedJobPosting,
                updateMessage
            )
        }
    }
}
