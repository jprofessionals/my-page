package no.jpro.mypageapi.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.lowagie.text.pdf.PdfReader
import com.lowagie.text.pdf.parser.PdfTextExtractor
import jakarta.mail.Multipart
import jakarta.mail.Part
import jakarta.mail.internet.MimeMessage
import no.jpro.mypageapi.dto.JobPostingDTO
import no.jpro.mypageapi.service.ai.GptConversationService
import org.jsoup.Jsoup
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.zwobble.mammoth.DocumentConverter
import java.util.*
import kotlin.collections.ArrayList


@Service
class ChatGPTEmailService(private val gptConversationService: GptConversationService) {

    private final val logger = LoggerFactory.getLogger(ChatGPTEmailService::class.java)


    private fun parsePartRecursive(part: Part, bodyTexts: MutableList<String> , attachmentTexts: MutableList<String>) {
        if (part.isMimeType("text/plain")) {
            bodyTexts.add(part.content as String)
        } else if (part.isMimeType("text/html")) {
            bodyTexts.add(Jsoup.parse(part.content as String).text())
        } else if (part.isMimeType("application/pdf")) {
            val pdfReader = PdfReader(part.inputStream)
            val pdfExtractor = PdfTextExtractor(pdfReader)
            val sb = StringBuilder()
            var i = 0;
            while (i < pdfReader.numberOfPages) {
                sb.append(pdfExtractor.getTextFromPage(i++))
                sb.append('\n')
            }
            attachmentTexts.add(sb.toString())
        } else if (part.isMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                   part.isMimeType("application/msword") ||
                   part.isMimeType("application/vnd.oasis.opendocument.text")) {
            val converter = DocumentConverter()
            val result: org.zwobble.mammoth.Result<String> = converter.extractRawText(part.inputStream)
            attachmentTexts.add(result.value)
        } else if (part.isMimeType("multipart/*")) {
            val multipart = part.content as Multipart
            var i = 0
            while (i < multipart.count) {
                parsePartRecursive(multipart.getBodyPart(i++), bodyTexts, attachmentTexts)
            }
        } else if (part.isMimeType("message/rfc822")) {
            parsePartRecursive(part.content as Part, bodyTexts, attachmentTexts)
        } else {
            logger.warn("Skipping MIME part ${part.contentType}")
        }
    }

    private fun parseEmail(message: MimeMessage, bodyTexts: MutableList<String> , attachmentTexts: MutableList<String>) {
        parsePartRecursive(message, bodyTexts, attachmentTexts)
    }

    private fun extractJobListing(part: String): JobPostingDTO? {
        return try {
            val mapper = jacksonObjectMapper()

            //TODO: Put ChatGPT conversation magic here. Good luck.
            gptConversationService.converseWithGpt("Kan du finne kunde, sted, antall stillinger og tilbudsfrist i en tekst. Gi resultatet som JSON uten ekstra tekst.", UUID.randomUUID())

            mapper.readValue(gptConversationService.converseWithGpt(part, UUID.randomUUID()), JobPostingDTO::class.java)
        } catch (e: Throwable) {
            null
        }
    }

    fun chatGPTJobPosting(message: MimeMessage): List<JobPostingDTO> {
        val result = mutableListOf<JobPostingDTO>()

        val bodyTexts = ArrayList<String>()
        val attachmentTexts = ArrayList<String>()
        parseEmail(message, bodyTexts, attachmentTexts)

        if (attachmentTexts.isEmpty()) {
            bodyTexts.forEach {
                val posting = extractJobListing(it)
                if (posting != null) {
                    result.add(posting)
                }
            }
        } else {
            attachmentTexts.forEach {
                val posting = extractJobListing(it)
                if (posting != null) {
                    result.add(posting)
                }
            }
        }

        return result
    }
}
