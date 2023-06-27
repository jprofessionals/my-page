package no.jpro.mypageapi.controller

import jakarta.mail.internet.MimeMessage
import no.jpro.mypage.RawEmail
import no.jpro.mypageapi.MockitoHelper
import no.jpro.mypageapi.MockitoHelper.anyObject
import no.jpro.mypageapi.event.PubSubBody
import no.jpro.mypageapi.event.PubSubMessage
import no.jpro.mypageapi.service.ChatGPTEmailService
import no.jpro.mypageapi.service.JobPostingService
import no.jpro.mypageapi.service.ParsedPart
import org.apache.avro.io.Encoder
import org.apache.avro.io.EncoderFactory
import org.apache.avro.specific.SpecificDatumWriter
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.fail
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito
import org.mockito.Mockito.*
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.security.oauth2.jwt.Jwt
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.time.Instant
import java.util.*

@ExtendWith(MockitoExtension::class)
class JobPostingControllerTest {

    @Mock
    lateinit var jobPostingService: JobPostingService

    @Mock
    lateinit var chatGPTEmailService: ChatGPTEmailService

    @InjectMocks
    lateinit var jobPostingController: JobPostingController

    private val avroEmailWriter = SpecificDatumWriter(RawEmail::class.java)

    @Test
    fun shouldHashFile() {
        val bytes = getFileData("/email1.rfc822")

        val digest = jobPostingController.hash(bytes)

        assertThat(digest).isEqualTo(EMAIL1_SHA256_HASH)
    }

    @Test
    fun shouldSendNewEventToChatGPT() {
        `when`(jobPostingService.existsByMessageId(anyString())).thenReturn(false)
        `when`(jobPostingService.existsByContentDigest(anyString())).thenReturn(false)

        val event = createEvent()

        jobPostingController.createJobPosting(createDummyJwt(), event)

        verify(jobPostingService).existsByMessageId(event.message.messageId)
        verify(chatGPTEmailService).parsePartRecursive(anyObject())
        verify(jobPostingService).existsByContentDigest(EMAIL1_PARSED_PARTS_SHA256_HASH)
        verify(chatGPTEmailService).chatGPTJobPosting(anyObject())
        verify(jobPostingService).createJobPostings(anyObject())
        verifyNoMoreInteractions(jobPostingService, chatGPTEmailService)
    }

    @Test
    fun shouldNotActOnSeenMessageId() {
        `when`(jobPostingService.existsByMessageId(anyString())).thenReturn(true)

        val event = createEvent()

        jobPostingController.createJobPosting(createDummyJwt(), event)

        verify(jobPostingService).existsByMessageId(event.message.messageId)
        verifyNoMoreInteractions(jobPostingService, chatGPTEmailService)
    }

    @Test
    fun shouldNotActOnSeenContentDigest() {
        `when`(jobPostingService.existsByMessageId(anyString())).thenReturn(false)
        `when`(jobPostingService.existsByContentDigest(anyString())).thenReturn(true)

        val event = createEvent()

        jobPostingController.createJobPosting(createDummyJwt(), event)

        verify(jobPostingService).existsByMessageId(event.message.messageId)
        verify(chatGPTEmailService).parsePartRecursive(anyObject())
        verify(jobPostingService).existsByContentDigest(EMAIL1_PARSED_PARTS_SHA256_HASH)
        verifyNoMoreInteractions(jobPostingService, chatGPTEmailService)
    }

    private fun getFileData(name: String) = this::class.java.getResource(name)
        ?.readBytes() ?: fail { "Resource not found" }

    private fun createDummyJwt() = Jwt(
        "dummy",
        Instant.now(),
        Instant.now().plusSeconds(60),
        mapOf(Pair("header", "value")),
        mapOf(Pair("claim", "value")),
    )

    private fun createEmail() = RawEmail(
        "from@example.com",
        listOf("to@example.com"),
        ByteBuffer.wrap(getFileData("/email1.rfc822"))
    )

    private fun createEvent(email: RawEmail = createEmail()): PubSubBody {
        return PubSubBody(
            PubSubMessage(
                encodeToBase64(encodeToAvro(email)),
                emptyMap(),
                "messageId",
                Instant.now().toString(),
            )
        )
    }

    private fun encodeToBase64(bytes: ByteArray): String {
        return Base64.getEncoder().encodeToString(bytes)
    }

    private fun encodeToAvro(email: RawEmail): ByteArray {
        val byteStream = ByteArrayOutputStream()
        val encoder: Encoder = EncoderFactory.get().directBinaryEncoder(byteStream,  /*reuse=*/null)
        email.customEncode(encoder)
        encoder.flush()
        return byteStream.toByteArray()
    }

    companion object {
        const val EMAIL1_SHA256_HASH = "3c57a3e9db3e074bf322dc8e41bf43729f5b8c2862afafdccb37042d44810d08"
        const val EMAIL1_PARSED_PARTS_SHA256_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
}
