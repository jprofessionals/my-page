package no.jpro.mypageapi.service

import no.jpro.mypageapi.model.JobPostingFile
import org.springframework.context.annotation.Profile
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import java.net.URI

@Service
@Profile("!gcp")
class JobPostingFilesServiceMock : JobPostingFilesService {

    override fun getJobPostingFiles(
        id: Long
    ): List<JobPostingFile> {
        return listOf(
            JobPostingFile(
                blobId = "1",
                name = "sample.pdf",
                url = URI("https://www.jpro.no/sample.pdf")
            )
        )
    }

    override fun uploadJobPostingFile(
        id: Long,
        filename: String,
        content: Resource
    ) {
    }

}