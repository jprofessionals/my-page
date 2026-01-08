package no.jpro.mypageapi.service

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import no.jpro.mypageapi.entity.ktu.KtuInvitation
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

/**
 * Resend implementation for sending KTU emails.
 * Only active when ktu.email.mock=false
 */
@Service
@ConditionalOnProperty(name = ["ktu.email.mock"], havingValue = "false")
class ResendKtuEmailService(
    @Value("\${resend.api-key}") private val apiKey: String,
    @Value("\${ktu.email.from:ktu@jprofessionals.no}") private val fromEmail: String,
    @Value("\${ktu.email.from-name:JProfessionals}") private val fromName: String,
    private val templateService: KtuEmailTemplateService
) : KtuEmailService {

    private val logger = LoggerFactory.getLogger(javaClass)

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    override fun sendInvitation(invitation: KtuInvitation, surveyUrl: String): Boolean {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant

        val email = contact.email
        if (email.isNullOrBlank()) {
            logger.warn("Cannot send invitation - contact ${contact.name} has no email address")
            return false
        }

        val html = templateService.renderInvitation(invitation, surveyUrl)

        return sendEmail(
            to = email,
            subject = "Kundetilfredshetsundersøkelse - ${consultant.name}",
            html = html
        )
    }

    override fun sendReminder(invitation: KtuInvitation, surveyUrl: String, reminderNumber: Int): Boolean {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant

        val email = contact.email
        if (email.isNullOrBlank()) {
            logger.warn("Cannot send reminder - contact ${contact.name} has no email address")
            return false
        }

        val html = templateService.renderReminder(invitation, surveyUrl, reminderNumber)

        return sendEmail(
            to = email,
            subject = "Påminnelse: Kundetilfredshetsundersøkelse - ${consultant.name}",
            html = html
        )
    }

    private fun sendEmail(to: String, subject: String, html: String): Boolean {
        val emailRequest = ResendEmailRequest(
            from = "$fromName <$fromEmail>",
            to = listOf(to),
            subject = subject,
            html = html
        )

        val jsonBody = json.encodeToString(emailRequest)
            .toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url("https://api.resend.com/emails")
            .post(jsonBody)
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("Content-Type", "application/json")
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    logger.info("Email sent successfully to $to. Response: $responseBody")
                    true
                } else {
                    val errorBody = response.body?.string()
                    logger.error("Failed to send email to $to. Status: ${response.code}, Error: $errorBody")
                    false
                }
            }
        } catch (e: Exception) {
            logger.error("Exception sending email to $to: ${e.message}", e)
            false
        }
    }
}

@Serializable
private data class ResendEmailRequest(
    val from: String,
    val to: List<String>,
    val subject: String,
    val html: String
)
