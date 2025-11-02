package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.CreateInformationNoticeDTO
import no.jpro.mypageapi.dto.InformationNoticeDTO
import no.jpro.mypageapi.dto.UpdateInformationNoticeDTO
import no.jpro.mypageapi.service.InformationNoticeService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.format.DateTimeParseException

@RestController
@RequestMapping("informationNotice")
@SecurityRequirement(name = "Bearer Authentication")
class InformationNoticeController(
    private val informationNoticeService: InformationNoticeService
) {
    @GetMapping
    @Operation(summary = "Get all information notices in the given period")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json", array = ArraySchema(
                schema = Schema(implementation = InformationNoticeDTO::class)
            )
        )]
    )

    fun getInformationNoticeInPeriod(
        token: JwtAuthenticationToken,
        @RequestParam("startDate") startDate: LocalDate,
        @RequestParam("endDate") endDate: LocalDate,
    ): ResponseEntity<List<InformationNoticeDTO>?> {
        try {
            val informationNotices: List<InformationNoticeDTO> =
                informationNoticeService.getInformationNoticesInPeriod(startDate, endDate)
            return ResponseEntity.ok(informationNotices)
        } catch (e: DateTimeParseException) {
            throw InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }

    @ExceptionHandler(InvalidDateException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleInvalidDateException(e: InvalidDateException): ErrorResponse {
        return ErrorResponse(e.message)
    }

    data class ErrorResponse(val message: String?)
    class InvalidDateException(message: String) : RuntimeException(message)

    @PostMapping("/post")
    @RequiresAdmin
    @Operation(summary = "An admin creates a new information notice")
    @ApiResponse(
        responseCode = "201",
        description = "New information notice created",
        content = [Content(schema = Schema(implementation = InformationNoticeDTO::class))]
    )
    fun createInformationNotice(
        token: JwtAuthenticationToken,
        @Valid @RequestBody infoNoticeRequest: CreateInformationNoticeDTO,
    ): ResponseEntity<String> {
        try {
            informationNoticeService.createInfoNotice(infoNoticeRequest)
            return ResponseEntity("A new information notice has been successfully created", HttpStatus.CREATED)
        } catch (e: IllegalArgumentException) {
            throw MyPageRestException(HttpStatus.BAD_REQUEST, e.message)
        }
    }

    @PatchMapping("admin/{infoNoticeId}")
    @RequiresAdmin
    @Operation(summary = "An admin edits an existing information notice")
    fun adminEditInfoNotice(
        token: JwtAuthenticationToken,
        @PathVariable("infoNoticeId") infoNoticeId: Long,
        @Valid @RequestBody editInfoNoticeRequest: UpdateInformationNoticeDTO,
    ): ResponseEntity<String> {
        val infoNoticeToEdit =
            informationNoticeService.getInfoNotice(infoNoticeId) ?: return ResponseEntity.notFound().build()
        try {
            informationNoticeService.editInformationNotice(editInfoNoticeRequest, infoNoticeToEdit)
            return ResponseEntity.ok("The notice has been successfully edited")
        } catch (e: IllegalArgumentException) {
            val errorMessage = e.message ?: "An error occurred while editing the notice."
            throw MyPageRestException(HttpStatus.BAD_REQUEST, errorMessage)
        }
    }

    @DeleteMapping("admin/{infoNoticeId}")
    @RequiresAdmin
    @Operation(summary = "An admin deletes the information notice connected to the notice id")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json")]
    )
    fun adminDeleteInfoNotice(
        token: JwtAuthenticationToken,
        @PathVariable("infoNoticeId") infoNoticeId: Long,
    ): ResponseEntity<String> {
        val infoNotice = informationNoticeService.getInfoNotice(infoNoticeId)
        if (infoNotice === null) {
            return ResponseEntity(HttpStatus.NOT_FOUND)
        }
        informationNoticeService.deleteInformationNotice(infoNoticeId)
        return ResponseEntity.ok("Information notice with ID $infoNoticeId has been deleted")
    }

    @GetMapping("/vacancy")
    @Operation(summary = "Gets information notice vacancies in a time period")
    @ApiResponse(
        responseCode = "200",
        content = [Content(
            mediaType = "application/json",
            schema = Schema(implementation = InformationNoticeDTO::class)
        )]
    )

    fun getVacancies(
        token: JwtAuthenticationToken,
        @RequestParam("startdate") startdate: String,
        @RequestParam("enddate") enddate: String,

        ): ResponseEntity<List<LocalDate>> {

        try {
            val parsedStartDate: LocalDate = LocalDate.parse(startdate)
            val parsedEndDate: LocalDate = LocalDate.parse(enddate)
            val availability = informationNoticeService.getAllVacanciesInAPeriod(parsedStartDate, parsedEndDate)
            return ResponseEntity.ok(availability)
        } catch (e: DateTimeParseException) {
            throw InvalidDateException("Invalid date format. Date must be in the format of yyyy-mm-dd.")
        }
    }
}
