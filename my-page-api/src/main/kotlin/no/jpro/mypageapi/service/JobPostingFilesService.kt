package no.jpro.mypageapi.service

import no.jpro.mypageapi.model.JobPostingFile

interface JobPostingFilesService {

    fun getJobPostingFiles(
        id: Long
    ): List<JobPostingFile>

}