package no.jpro.mypageapi.service

import jakarta.persistence.EntityNotFoundException
import no.jpro.mypageapi.entity.Customer
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.repository.CustomerRepository
import no.jpro.mypageapi.repository.JobPostingRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class JobPostingService(
    private val customerRepository: CustomerRepository,
    private val jobPostingRepository: JobPostingRepository
) {

    @Transactional
    fun createJobPosting(
        jobPosting: JobPosting
    ): no.jpro.mypageapi.entity.JobPosting {
        val customerEntity = customerRepository.findByName(jobPosting.customer) ?: customerRepository.save(
            Customer(
                name = jobPosting.customer
            )
        )

        val jobPostingToPersist = no.jpro.mypageapi.entity.JobPosting(
            title = jobPosting.title,
            customer = customerEntity,
            description = jobPosting.description,
            deadline = jobPosting.deadline
        )

        return jobPostingRepository.save(jobPostingToPersist)
    }

    fun deleteJobPosting(
        id: Long
    ) {
        jobPostingRepository.deleteById(id)
    }

    fun getJobPostings(): List<no.jpro.mypageapi.entity.JobPosting> {
        return jobPostingRepository.findAll()
    }

    @Transactional
    fun updateJobPosting(
        jobPosting: JobPosting
    ): no.jpro.mypageapi.entity.JobPosting {
        val existingJobPosting = jobPostingRepository.findById(jobPosting.id)
            .orElseThrow {
                EntityNotFoundException("Job posting with id ${jobPosting.id} not found")
            }

        val customerEntity = customerRepository.findByName(jobPosting.customer) ?: customerRepository.save(
            Customer(
                name = jobPosting.customer
            )
        )

        return jobPostingRepository.save(
            existingJobPosting.apply {
                title = jobPosting.title
                customer = customerEntity
                description = jobPosting.description
                deadline = jobPosting.deadline
            }
        )
    }
}