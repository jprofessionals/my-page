package no.jpro.mypageapi.service

import com.google.cloud.storage.BlobId
import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.HttpMethod
import com.google.cloud.storage.Storage
import com.google.cloud.storage.Storage.SignUrlOption
import no.jpro.mypageapi.model.JobPostingFile
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import java.net.URLConnection
import java.util.concurrent.TimeUnit

@Service
@Profile("gcp")
class JobPostingFilesServiceImpl(
    @Value("\${gcs.jobpostings.bucket.name}") private val bucketName: String,
    private val storage: Storage
) : JobPostingFilesService {

    override fun deleteJobPostingFile(
        jobPostingId: Long,
        fileName: String
    ) {
        storage.delete(
            BlobId.of(
                bucketName,
                "$jobPostingId/$fileName"
            )
        )
    }

    override fun getJobPostingFiles(
        jobPostingId: Long
    ): List<JobPostingFile> {
        return storage
            .list(
                bucketName,
                Storage.BlobListOption.prefix(jobPostingId.toString())
            )
            .iterateAll()
            .toList()
            .filterNot {
                it.name.endsWith("/")
            }
            .map {
                val fileName = it.name.split("/").last()
                val mimeType = getMimeType(fileName)
                val isBrowsable = isBrowsableMimeType(mimeType)
                val signUrlOptions = mutableListOf(
                    SignUrlOption.httpMethod(HttpMethod.GET),
                    SignUrlOption.withV4Signature()
                )
                if (isBrowsable) {
                    signUrlOptions.add(
                        SignUrlOption.withQueryParams(
                            mapOf(
                                "response-content-disposition" to "inline",
                                "response-content-type" to mimeType
                            )
                        )
                    )
                }
                JobPostingFile(
                    blobId = "${it.name}",
                    name = fileName,
                    url = it.signUrl(
                        1,
                        TimeUnit.HOURS,
                        *signUrlOptions.toTypedArray()
                    ).toURI()
                )
            }
    }

    override fun uploadJobPostingFile(
        jobPostingId: Long,
        filename: String,
        content: Resource
    ) {
        val blobInfo = BlobInfo.newBuilder(
            bucketName,
            "$jobPostingId/$filename"
        ).build()
        content.inputStream.use { inputStream ->
            storage.createFrom(blobInfo, inputStream)
        }
    }

    private fun getMimeType(
        fileName: String
    ): String {
        return URLConnection
            .guessContentTypeFromName(fileName) ?: "application/octet-stream"
    }

    private fun isBrowsableMimeType(
        mimeType: String
    ): Boolean {
        val browsableMimeTypes = setOf(
            "application/pdf",
            "text/plain",
            "text/html",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/svg+xml",
            "text/css",
            "text/javascript",
            "application/javascript",
            "audio/mpeg",
            "video/mp4",
            "audio/ogg",
            "video/ogg",
            "audio/webm",
            "video/webm"
        )
        return browsableMimeTypes.contains(mimeType)
    }

}