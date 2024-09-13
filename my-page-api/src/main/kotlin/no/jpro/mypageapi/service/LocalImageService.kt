package no.jpro.mypageapi.service

import com.google.cloud.storage.Storage
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.io.InputStream
import java.lang.RuntimeException
import java.nio.channels.Channels


@Service
@Profile("!gcp")
class LocalImageService : ImageService {
    override fun getImage(fileName: String): InputStream {
        return this::class.java.classLoader.getResourceAsStream(fileName)
            ?: throw RuntimeException("image not found")
    }
}
