package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.JobPostingDTO
import org.springframework.stereotype.Service

@Service
class JobPostingService {

    fun getAllJobPostings(): List<JobPostingDTO> {
        return listOf()
    }

}