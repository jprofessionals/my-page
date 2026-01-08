package no.jpro.mypageapi.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.concurrent.ConcurrentHashMap

/**
 * Mock implementation of KtuLogoService for local development.
 * Stores logos on local filesystem and returns URLs pointing to a local endpoint.
 */
@Service
@Profile("!gcp & !railway")
class KtuLogoServiceMock(
    @Value("\${app.base-url:http://localhost:8080/api}") private val baseUrl: String
) : KtuLogoService {

    // Track uploaded files (key -> filename)
    private val logoStore = ConcurrentHashMap<String, String>()

    // Local storage directory
    private val storageDir: Path = Path.of(System.getProperty("java.io.tmpdir"), "ktu-logos")

    init {
        Files.createDirectories(storageDir)
    }

    override fun uploadLogo(
        roundId: Long,
        filename: String,
        content: Resource
    ): String {
        val key = "$roundId/$filename"

        // Create directory for round if needed
        val roundDir = storageDir.resolve(roundId.toString())
        Files.createDirectories(roundDir)

        // Save file to disk
        val filePath = roundDir.resolve(filename)
        content.inputStream.use { input ->
            Files.copy(input, filePath, StandardCopyOption.REPLACE_EXISTING)
        }

        logoStore[key] = filename

        // Return URL pointing to local serving endpoint
        return "$baseUrl/ktu/logos/$roundId/$filename"
    }

    override fun deleteLogo(
        roundId: Long,
        filename: String
    ) {
        val key = "$roundId/$filename"
        logoStore.remove(key)

        // Delete file from disk
        val filePath = storageDir.resolve(roundId.toString()).resolve(filename)
        Files.deleteIfExists(filePath)
    }

    override fun getLogoUrl(
        roundId: Long,
        filename: String
    ): String? {
        val key = "$roundId/$filename"
        return if (logoStore.containsKey(key)) {
            "$baseUrl/ktu/logos/$roundId/$filename"
        } else {
            null
        }
    }

    /**
     * Get the file content for serving. Used by the controller endpoint.
     */
    fun getLogoContent(roundId: Long, filename: String): ByteArray? {
        val filePath = storageDir.resolve(roundId.toString()).resolve(filename)
        return if (Files.exists(filePath)) {
            Files.readAllBytes(filePath)
        } else {
            null
        }
    }

    fun getMimeType(filename: String): String {
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
