package no.jpro.mypageapi.service

import com.google.cloud.storage.HttpMethod
import com.google.cloud.storage.Storage
import com.google.cloud.storage.Storage.SignUrlOption
import no.jpro.mypageapi.model.JobPostingFile
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

@Service
class JobPostingFilesService(
    private val storage: Storage
) {

    fun getJobPostingFiles(
        id: Long
    ): List<JobPostingFile> {
        return storage
            .list(
                "utlysninger-dokumenter-test",
                Storage.BlobListOption.prefix(id.toString())
            )
            .iterateAll()
            .toList()
            .map {
                JobPostingFile(
                    name = it.name,
                    url = it.signUrl(
                        1,
                        TimeUnit.HOURS,
                        SignUrlOption.httpMethod(HttpMethod.GET),
                        SignUrlOption.withV4Signature()
                    ).toURI()
                )
            }

    }

}