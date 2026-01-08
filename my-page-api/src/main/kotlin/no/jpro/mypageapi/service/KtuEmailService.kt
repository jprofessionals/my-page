package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.ktu.KtuInvitation
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service

/**
 * Interface for sending KTU survey emails.
 * Implementations can use different email providers (SendGrid, SES, etc.)
 */
interface KtuEmailService {
    /**
     * Send initial survey invitation email.
     * @param invitation The invitation with assignment details
     * @param surveyUrl The URL to the survey form
     * @return true if email was sent successfully
     */
    fun sendInvitation(invitation: KtuInvitation, surveyUrl: String): Boolean

    /**
     * Send reminder email for survey that hasn't been completed.
     * @param invitation The invitation with assignment details
     * @param surveyUrl The URL to the survey form
     * @param reminderNumber Which reminder this is (1st, 2nd, etc.)
     * @return true if email was sent successfully
     */
    fun sendReminder(invitation: KtuInvitation, surveyUrl: String, reminderNumber: Int): Boolean
}

/**
 * Mock implementation that logs emails instead of sending them.
 * Used for local development and testing.
 */
@Service
@ConditionalOnProperty(name = ["ktu.email.mock"], havingValue = "true", matchIfMissing = true)
class MockKtuEmailService(
    private val templateService: KtuEmailTemplateService
) : KtuEmailService {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun sendInvitation(invitation: KtuInvitation, surveyUrl: String): Boolean {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant

        val email = contact.email
        if (email.isNullOrBlank()) {
            logger.warn("Cannot send invitation - contact ${contact.name} has no email address")
            return false
        }

        // Render actual HTML template (for testing/debugging purposes)
        val html = templateService.renderInvitation(invitation, surveyUrl)

        logger.info("""
            ====== MOCK EMAIL: KTU Invitation ======
            To: $email
            Subject: Kundetilfredshetsundersøkelse - ${consultant.name}
            Survey URL: $surveyUrl
            HTML Length: ${html.length} chars
            ========================================
        """.trimIndent())

        return true
    }

    override fun sendReminder(invitation: KtuInvitation, surveyUrl: String, reminderNumber: Int): Boolean {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant

        val email = contact.email
        if (email.isNullOrBlank()) {
            logger.warn("Cannot send reminder - contact ${contact.name} has no email address")
            return false
        }

        // Render actual HTML template (for testing/debugging purposes)
        val html = templateService.renderReminder(invitation, surveyUrl, reminderNumber)

        logger.info("""
            ====== MOCK EMAIL: KTU Reminder #$reminderNumber ======
            To: $email
            Subject: Påminnelse: Kundetilfredshetsundersøkelse - ${consultant.name}
            Survey URL: $surveyUrl
            HTML Length: ${html.length} chars
            =============================================
        """.trimIndent())

        return true
    }
}
