package no.jpro.mypageapi.service

import org.springframework.core.io.Resource

/**
 * Service for managing KTU survey logos.
 * Logos are stored per round and can be uploaded, retrieved, and deleted.
 */
interface KtuLogoService {

    /**
     * Upload a logo for a specific round.
     * @param roundId The round ID
     * @param filename The original filename
     * @param content The file content
     * @return The public URL of the uploaded logo
     */
    fun uploadLogo(
        roundId: Long,
        filename: String,
        content: Resource
    ): String

    /**
     * Delete the logo for a specific round.
     * @param roundId The round ID
     * @param filename The filename to delete
     */
    fun deleteLogo(
        roundId: Long,
        filename: String
    )

    /**
     * Get the public URL for a logo.
     * @param roundId The round ID
     * @param filename The filename
     * @return The signed URL for accessing the logo
     */
    fun getLogoUrl(
        roundId: Long,
        filename: String
    ): String?

    companion object {
        val ALLOWED_EXTENSIONS = setOf("png", "jpg", "jpeg", "svg", "webp")
        const val MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024L // 2MB
    }
}
