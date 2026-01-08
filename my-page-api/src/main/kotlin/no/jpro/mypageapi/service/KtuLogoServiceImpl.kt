package no.jpro.mypageapi.service

import com.google.cloud.storage.BlobId
import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.HttpMethod
import com.google.cloud.storage.Storage
import com.google.cloud.storage.Storage.SignUrlOption
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

@Service
@Profile("gcp", "railway")
class KtuLogoServiceImpl(
    @Value("\${gcs.ktu-logos.bucket.name:\${gcs.jobpostings.bucket.name}}") private val bucketName: String,
    private val storage: Storage
) : KtuLogoService {

    companion object {
        private const val LOGO_PREFIX = "ktu-logos"
    }

    override fun uploadLogo(
        roundId: Long,
        filename: String,
        content: Resource
    ): String {
        val blobPath = "$LOGO_PREFIX/$roundId/$filename"
        val blobInfo = BlobInfo.newBuilder(bucketName, blobPath)
            .setContentType(getMimeType(filename))
            .build()

        content.inputStream.use { inputStream ->
            storage.createFrom(blobInfo, inputStream)
        }

        // Return a signed URL valid for 1 year (logos should be accessible)
        return getSignedUrl(blobPath)
    }

    override fun deleteLogo(
        roundId: Long,
        filename: String
    ) {
        val blobPath = "$LOGO_PREFIX/$roundId/$filename"
        storage.delete(BlobId.of(bucketName, blobPath))
    }

    override fun getLogoUrl(
        roundId: Long,
        filename: String
    ): String? {
        val blobPath = "$LOGO_PREFIX/$roundId/$filename"
        val blob = storage.get(BlobId.of(bucketName, blobPath))
        return if (blob != null && blob.exists()) {
            getSignedUrl(blobPath)
        } else {
            null
        }
    }

    private fun getSignedUrl(blobPath: String): String {
        val blob = storage.get(BlobId.of(bucketName, blobPath))
        return blob.signUrl(
            365,
            TimeUnit.DAYS,
            SignUrlOption.httpMethod(HttpMethod.GET),
            SignUrlOption.withV4Signature(),
            SignUrlOption.withQueryParams(
                mapOf(
                    "response-content-disposition" to "inline",
                    "response-content-type" to getMimeType(blobPath)
                )
            )
        ).toString()
    }

    private fun getMimeType(filename: String): String {
        val extension = filename.substringAfterLast('.', "").lowercase()
        return when (extension) {
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            "svg" -> "image/svg+xml"
            "webp" -> "image/webp"
            else -> "application/octet-stream"
        }
    }
}
