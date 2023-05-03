package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.JobPostingDTO
import no.jpro.mypageapi.entity.JobPosting
import org.springframework.stereotype.Service

@Service
class JobPostingMapper {

    fun toJobPostingDTO(jobPosting: JobPosting): JobPostingDTO {
        return JobPostingDTO(
            id = jobPosting.id,
            title = jobPosting.title,
            description = jobPosting.description,
            customer = jobPosting.customer,
            tags = jobPosting.tags.map { it.name },
            location = jobPosting.location,
            dueDateForApplication = jobPosting.dueDateForApplication,
            requiredYearsOfExperience = jobPosting.requiredYearsOfExperience,
            resourcesNeeded = jobPosting.resourcesNeeded
        )
    }

}