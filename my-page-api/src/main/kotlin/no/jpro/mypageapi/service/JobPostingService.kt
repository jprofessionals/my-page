package no.jpro.mypageapi.service

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
        val customer = customerRepository.findByName(jobPosting.customer) ?: customerRepository.save(
            Customer(
                name = jobPosting.customer
            )
        )

        val jobPostingToPersist = no.jpro.mypageapi.entity.JobPosting(
            title = jobPosting.title,
            customer = customer,
            description = jobPosting.description,
            deadline = jobPosting.deadline
        )

        return jobPostingRepository.save(jobPostingToPersist)
    }

    fun getJobPostings(): List<no.jpro.mypageapi.entity.JobPosting> {
        return jobPostingRepository.findAll()
    }
}