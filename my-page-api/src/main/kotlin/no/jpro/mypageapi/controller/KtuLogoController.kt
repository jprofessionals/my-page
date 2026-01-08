package no.jpro.mypageapi.controller

import no.jpro.mypageapi.service.KtuLogoServiceMock
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Controller for serving KTU logos in local development.
 * Only active when not running on GCP/Railway (where logos are served from GCS).
 */
@RestController
@RequestMapping("/ktu/logos")
@Profile("!gcp & !railway")
class KtuLogoController(
    private val logoService: KtuLogoServiceMock
) {

    @GetMapping("/{roundId}/{filename}")
    fun getLogo(
        @PathVariable roundId: Long,
        @PathVariable filename: String
    ): ResponseEntity<ByteArray> {
        val content = logoService.getLogoContent(roundId, filename)
            ?: return ResponseEntity.notFound().build()

        val mimeType = logoService.getMimeType(filename)
        val headers = HttpHeaders().apply {
            contentType = MediaType.parseMediaType(mimeType)
            cacheControl = "max-age=86400" // Cache for 1 day
        }

        return ResponseEntity(content, headers, HttpStatus.OK)
    }
}