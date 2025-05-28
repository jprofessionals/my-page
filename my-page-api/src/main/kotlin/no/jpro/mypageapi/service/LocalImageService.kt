package no.jpro.mypageapi.service

import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.io.InputStream

@Service
@Profile("!gcp")
class LocalImageService : ImageService {
    override fun getImage(fileName: String): InputStream {
        return this::class.java.classLoader.getResourceAsStream(fileName)
            ?: throw RuntimeException("image not found")
    }
}
