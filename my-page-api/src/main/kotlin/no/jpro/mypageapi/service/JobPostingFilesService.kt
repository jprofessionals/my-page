package no.jpro.mypageapi.service

import no.jpro.mypageapi.model.JobPostingFile
import org.springframework.core.io.Resource

interface JobPostingFilesService {

    fun getJobPostingFiles(
        id: Long
    ): List<JobPostingFile>

    fun uploadJobPostingFile(
        id: Long,
        filename: String,
        content: Resource
    )

}