package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.repository.JobPostingRepository
import org.springframework.stereotype.Service

@Service
class JobPostingService(
    private val jobPostingRepository: JobPostingRepository
) {

    fun getAllJobPostings(): List<JobPosting> {
        return jobPostingRepository.findAll()
    }

    fun createJobPostings(jobPostings: List<JobPosting>) {
        jobPostingRepository.saveAll(jobPostings)
    }
}
