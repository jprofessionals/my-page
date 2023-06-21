package no.jpro.mypageapi.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
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
import java.time.ZonedDateTime
import java.util.*


@Service
class ChatGPTEmailService(
    private val gptConversationService: GptConversationService,
    private val objectMapper: ObjectMapper,
) {

    enum class DocumentType(val order: Int) {
        PLAINTEXT(0),
        WORD(1),
        PDF(2),
        HTML(99),
    }

    private final val logger = LoggerFactory.getLogger(ChatGPTEmailService::class.java)


    private fun parsePartRecursive(part: Part): List<ParsedPart> {
        if (part.isMimeType("text/plain")) {
            return listOf(ParsedPart(DocumentType.PLAINTEXT, part.content as String))
        } else if (part.isMimeType("text/html")) {
            return listOf(ParsedPart(DocumentType.HTML, Jsoup.parse(part.content as String).text()))
        } else if (part.isMimeType("application/pdf")) {
            val pdfReader = PdfReader(part.inputStream)
            val pdfExtractor = PdfTextExtractor(pdfReader)
            val sb = StringBuilder()
            var i = 0;
            while (i < pdfReader.numberOfPages) {
                sb.append(pdfExtractor.getTextFromPage(i++))
                sb.append('\n')
            }
            return listOf(ParsedPart(DocumentType.PDF, sb.toString()))
        } else if (part.isMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                   part.isMimeType("application/msword") ||
                   part.isMimeType("application/vnd.oasis.opendocument.text")) {
            val converter = DocumentConverter()
            val result: org.zwobble.mammoth.Result<String> = converter.extractRawText(part.inputStream)
            return listOf(ParsedPart(DocumentType.WORD, result.value))
        } else if (part.isMimeType("multipart/*")) {
            val multipart = part.content as Multipart
            return (0 until multipart.count)
                .flatMap { parsePartRecursive(multipart.getBodyPart(it)) }
        } else if (part.isMimeType("message/rfc822")) {
            return parsePartRecursive(part.content as Part)
        } else {
            logger.warn("Skipping MIME part ${part.contentType}")
            return emptyList()
        }
    }

    private fun extractJobListing(part: String): JobPostingDTO? {
        return try {
            //TODO: Put ChatGPT conversation magic here. Good luck.
            gptConversationService.converseWithGpt("Kan du finne kunde, sted, antall stillinger og tilbudsfrist i en tekst. Gi resultatet som JSON uten ekstra tekst.", UUID.randomUUID())

            objectMapper.readValue(gptConversationService.converseWithGpt(part, UUID.randomUUID()), JobPostingDTO::class.java)
        } catch (e: Throwable) {
            null
        }
    }

    fun chatGPTJobPosting(message: MimeMessage): List<ChatGPTResponse> {
        val parts = parsePartRecursive(message)

        val conversationId: UUID = UUID.randomUUID()

        val prompt = """
            Her er en utlysning for en konsulent-stilling:
            
            ${getContentToInclude(parts)}
            
            Basert på teksten, kan du fylle ut følgende JSON objekt? 
            Svar kun med JSON og uten ekstra tekst eller tegn.
            Tidspunkt skal være i RFC3339 format.
            [    
                {
                  "kunde": "",
                  "rolle": "",
                  "antallStillinger": 0
                  "arbeidssted": "",
                  "totaltAntallÅrsErfaring": 0,
                  "søknadsfrist": "",
                  "systemEllerProsjekt": "",
                  "teknologier": [
                    ""
                  ]
                }
            ]
        """
        val finalResponse = gptConversationService.converseWithGpt(
            prompt.trimIndent(), conversationId)
        val result = objectMapper.readValue(finalResponse, object : TypeReference<List<ChatGPTResponse>>() {})

        return result
    }

    private fun getContentToInclude(parts: List<ParsedPart>): String {
        val maxLength = 20_000
        val stringBuilder = StringBuilder();
        parts
            .filterNot { it.documentType == DocumentType.HTML }
            .sortedWith(compareBy({ it.documentType.order }, { it.parsedContent.length } ))
            .forEach {
                if (stringBuilder.length + it.parsedContent.length > maxLength) {
                    return@forEach
                }
                stringBuilder.append(it.parsedContent)
                stringBuilder.append("\n")
            }

        return stringBuilder.toString()
    }
}

data class ParsedPart(
    val documentType: ChatGPTEmailService.DocumentType,
    val parsedContent: String,
)

data class ChatGPTResponse(
    val kunde: String,
    val rolle: String,
    val antallStillinger: Int,
    val arbeidssted: String,
    val totaltAntallÅrsErfaring: Int,
    val søknadsfrist: ZonedDateTime,
    val systemEllerProsjekt: String,
    val teknologier: List<String>,
)
