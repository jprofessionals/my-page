package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.kti.KtiInvitation
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service

/**
 * Interface for sending KTI survey emails.
 * Implementations can use different email providers (SendGrid, SES, etc.)
 */
interface KtiEmailService {
    /**
     * Send initial survey invitation email.
     * @param invitation The invitation with assignment details
     * @param surveyUrl The URL to the survey form
     * @return true if email was sent successfully
     */
    fun sendInvitation(invitation: KtiInvitation, surveyUrl: String): Boolean

    /**
     * Send reminder email for survey that hasn't been completed.
     * @param invitation The invitation with assignment details
     * @param surveyUrl The URL to the survey form
     * @param reminderNumber Which reminder this is (1st, 2nd, etc.)
     * @return true if email was sent successfully
     */
    fun sendReminder(invitation: KtiInvitation, surveyUrl: String, reminderNumber: Int): Boolean
}

/**
 * Mock implementation that logs emails instead of sending them.
 * Used for local development and testing.
 */
@Service
@ConditionalOnProperty(name = ["kti.email.mock"], havingValue = "true", matchIfMissing = true)
class MockKtiEmailService : KtiEmailService {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun sendInvitation(invitation: KtiInvitation, surveyUrl: String): Boolean {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant
        val organization = contact.organization

        logger.info("""
            ====== MOCK EMAIL: KTI Invitation ======
            To: ${contact.email}
            Subject: KTI-undersøkelse for ${consultant.name}

            Hei ${contact.name},

            Vi ønsker din tilbakemelding på samarbeidet med ${consultant.name} fra JProfessionals.

            Klikk her for å svare på undersøkelsen:
            $surveyUrl

            Takk for at du tar deg tid!

            Med vennlig hilsen,
            JProfessionals
            ========================================
        """.trimIndent())

        return true
    }

    override fun sendReminder(invitation: KtiInvitation, surveyUrl: String, reminderNumber: Int): Boolean {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant

        logger.info("""
            ====== MOCK EMAIL: KTI Reminder #$reminderNumber ======
            To: ${contact.email}
            Subject: Påminnelse: KTI-undersøkelse for ${consultant.name}

            Hei ${contact.name},

            Dette er en vennlig påminnelse om å svare på KTI-undersøkelsen
            for ${consultant.name} fra JProfessionals.

            Klikk her for å svare på undersøkelsen:
            $surveyUrl

            Takk for at du tar deg tid!

            Med vennlig hilsen,
            JProfessionals
            =============================================
        """.trimIndent())

        return true
    }
}
