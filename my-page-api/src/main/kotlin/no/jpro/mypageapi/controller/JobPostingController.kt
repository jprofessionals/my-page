package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.mail.Session
import jakarta.mail.internet.MimeMessage
import no.jpro.mypage.RawEmail
import no.jpro.mypageapi.dto.JobPostingDTO
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.event.PubSubBody
import no.jpro.mypageapi.service.ChatGPTEmailService
import no.jpro.mypageapi.service.JobPostingService
import no.jpro.mypageapi.service.ParsedPart
import no.jpro.mypageapi.utils.mapper.JobPostingMapper
import no.jpro.mypageapi.utils.mapper.JobPostingMapper.toJobPosting
import org.apache.avro.io.Decoder
import org.apache.avro.io.DecoderFactory
import org.apache.avro.specific.SpecificDatumReader
import org.slf4j.LoggerFactory
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.io.ByteArrayInputStream
import java.security.MessageDigest
import java.util.*

@RestController
@RequestMapping("jobposting")
@SecurityRequirement(name = "Bearer Authentication")
class JobPostingController(
    private val jobPostingService: JobPostingService,
    private val chatGPTEmailService: ChatGPTEmailService,
) {

    private val logger = LoggerFactory.getLogger(JobPostingController::class.java)

    private val reader = SpecificDatumReader(RawEmail::class.java)

    @GetMapping
    @Transactional
    @Operation(summary = "Get all job postings")
    @ApiResponse(
        responseCode = "200",
        description = "All job postings",
        content = [Content(schema = Schema(implementation = JobPostingDTO::class))]
    )
    fun getAllJobPostings(): List<JobPostingDTO> {
        logger.info("Getting all job postings")

        val jobPostingDTOList = jobPostingService.getAllJobPostings().map { JobPostingMapper.toJobPostingDTO(it) }
        logger.info("Got the following job postings: $jobPostingDTOList")

        return jobPostingDTOList
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Create a new job posting from an PubSub event")
    @ApiResponse(
        responseCode = "201",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserDTO::class))]
    )
    fun createJobPosting(
        @Parameter(hidden = true) @AuthenticationPrincipal jwt: Jwt,
        @RequestBody event: PubSubBody
    ) {
        try {
            logger.info("Creating new job posting: messageId={}, publishTime={}",
                event.message.messageId, event.message.publishTime)
            if (jobPostingService.existsByMessageId(event.message.messageId)) {
                logger.info("Job posting already exists for: messageId={}", event.message.messageId)
                return
            }
            val data = decodeBase64(event)
            val email = decodeAvro(data) ?: return
            ByteArrayInputStream(email.content.array()).use { inputStream ->
                val mimeMessage = MimeMessage(Session.getDefaultInstance(System.getProperties()), inputStream)
                val parsedParts = chatGPTEmailService.parsePartRecursive(mimeMessage)
                val contentDigest = hashMultiparts(parsedParts)
                if (jobPostingService.existsByContentDigest(contentDigest)) {
                    logger.info("Job posting already exists for: contentDigest={}", contentDigest)
                    return
                }
                val jobPosting = mapToJobPostings(mimeMessage.subject, parsedParts, contentDigest, event.message.messageId)
                jobPostingService.createJobPostings(jobPosting)
            }
        } catch (e: Exception) {
            logger.warn("Error creating new job posting", e)
        }
    }

    private fun hashMultiparts(parsedParts: List<ParsedPart>): String {
        return hash(parsedParts.joinToString("\n") { it.parsedContent }.toByteArray())
    }

    fun hash(content: ByteArray): String {
        return MessageDigest.getInstance("SHA256")
            .digest(content)
            .joinToString("") { String.format("%02x", it) }
    }

    private fun mapToJobPostings(
        subject: String,
        parsedParts: List<ParsedPart>,
        contentDigest: String,
        messageId: String
    ): List<JobPosting> {
        val chatGPTJobPostings = chatGPTEmailService.chatGPTJobPosting(parsedParts)
        val jobPostings = chatGPTJobPostings.map {
            toJobPosting(subject, it, contentDigest, messageId)
        }
        return jobPostings
    }

    private fun decodeAvro(data: ByteArray): RawEmail? {
        try {
            ByteArrayInputStream(data).use { inputStream ->
                val decoder: Decoder = DecoderFactory.get().directBinaryDecoder(inputStream,  /*reuse=*/null)
                return reader.read(null, decoder)
            }
        } catch (e: Exception) {
            val message = "Error decoding Avro"
            logger.warn(message, e)
        }
        return null
    }

    private fun decodeBase64(event: PubSubBody): ByteArray =
        Base64.getDecoder().decode(event.message.data)

}
