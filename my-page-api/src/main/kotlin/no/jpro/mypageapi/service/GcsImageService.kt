package no.jpro.mypageapi.service

import com.google.cloud.storage.Storage
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.io.InputStream
import java.nio.channels.Channels


@Service
@Profile("gcp")
class GcsImageService(
    @Value("\${gcs.bucket.name}") private var bucketName: String,
    val storage: Storage
) : ImageService {
    override fun getImage(fileName: String): InputStream {
        val reader = storage.reader(bucketName, fileName)
        return Channels.newInputStream(reader)
    }
}
