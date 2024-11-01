package no.jpro.mypageapi.service

import no.jpro.mypageapi.model.JobPostingFile
import org.springframework.core.io.Resource

interface JobPostingFilesService {

    fun getJobPostingFiles(
        jobPostingId: Long
    ): List<JobPostingFile>

    fun uploadJobPostingFile(
        jobPostingId: Long,
        filename: String,
        content: Resource
    )

}