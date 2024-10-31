package no.jpro.mypageapi.service

import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.HttpMethod
import com.google.cloud.storage.Storage
import com.google.cloud.storage.Storage.SignUrlOption
import no.jpro.mypageapi.model.JobPostingFile
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

@Service
@Profile("gcp")
class JobPostingFilesServiceImpl(
    @Value("\${gcs.jobpostings.bucket.name}") private val bucketName: String,
    private val storage: Storage
) : JobPostingFilesService {

    override fun getJobPostingFiles(
        id: Long
    ): List<JobPostingFile> {
        return storage
            .list(
                bucketName,
                Storage.BlobListOption.prefix(id.toString())
            )
            .iterateAll()
            .toList()
            .filterNot {
                it.name.endsWith("/")
            }
            .map {
                JobPostingFile(
                    blobId = it.blobId.toString(),
                    name = it.name.split("/").last(),
                    url = it.signUrl(
                        1,
                        TimeUnit.HOURS,
                        SignUrlOption.httpMethod(HttpMethod.GET),
                        SignUrlOption.withV4Signature()
                    ).toURI()
                )
            }

    }

    override fun uploadJobPostingFile(
        id: Long,
        filename: String,
        content: Resource
    ) {
        val blobInfo = BlobInfo.newBuilder(
            bucketName,
            "$id/$filename"
        ).build()
        content.inputStream.use { inputStream ->
            storage.createFrom(blobInfo, inputStream)
        }
    }

}