package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.service.ImageService
import org.springframework.core.io.InputStreamResource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping


@Controller
@RequestMapping("image")
@SecurityRequirement(name = "Bearer Authentication")
class ImageController(
    private val imageService: ImageService,
) {
    @GetMapping("/{fileName}")
    @Operation(summary = "Get an image")
    fun getImage(
        @PathVariable fileName: String,
    ): ResponseEntity<InputStreamResource> {
        val imageInputStream = imageService.getImage(fileName)
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .body(InputStreamResource(imageInputStream))
    }
}
