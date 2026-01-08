package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.ktu.KtuInvitation
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

/**
 * Service for rendering KTU email templates.
 */
@Service
class KtuEmailTemplateService(
    @Value("\${app.base-url:https://minside.jpro.no}") private val baseUrl: String
) {

    /**
     * Render invitation email HTML.
     */
    fun renderInvitation(invitation: KtuInvitation, surveyUrl: String): String {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant
        val organization = contact.organization

        return buildEmailHtml(
            title = "Kundetilfredshetsundersøkelse",
            preheader = "Vi ønsker din tilbakemelding på samarbeidet med ${consultant.name}",
            content = """
                <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 24px;">
                    Hei ${contact.name}!
                </h1>

                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                    Vi i JProfessionals setter stor pris på samarbeidet med ${organization.name},
                    og ønsker å høre dine tilbakemeldinger.
                </p>

                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    Vi ber deg vennligst ta deg noen minutter til å svare på en kort undersøkelse
                    om din opplevelse med vår konsulent <strong>${consultant.name}</strong>.
                </p>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="$surveyUrl"
                       style="background-color: #3b82f6; color: white; padding: 16px 32px;
                              text-decoration: none; border-radius: 8px; font-weight: 600;
                              display: inline-block; font-size: 16px;">
                        Svar på undersøkelsen
                    </a>
                </div>

                <p style="color: #718096; font-size: 14px; line-height: 1.6;">
                    Undersøkelsen tar ca. 2-3 minutter å gjennomføre. Dine svar behandles konfidensielt
                    og brukes til å forbedre våre tjenester.
                </p>
            """.trimIndent()
        )
    }

    /**
     * Render reminder email HTML.
     */
    fun renderReminder(invitation: KtuInvitation, surveyUrl: String, reminderNumber: Int): String {
        val contact = invitation.assignment.contact
        val consultant = invitation.assignment.consultant

        val reminderText = when (reminderNumber) {
            1 -> "en vennlig påminnelse"
            2 -> "en siste påminnelse"
            else -> "en påminnelse"
        }

        return buildEmailHtml(
            title = "Påminnelse: Kundetilfredshetsundersøkelse",
            preheader = "Vi venter fortsatt på din tilbakemelding om ${consultant.name}",
            content = """
                <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 24px;">
                    Hei ${contact.name}!
                </h1>

                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                    Dette er $reminderText om kundetilfredshetsundersøkelsen vi sendte deg tidligere.
                </p>

                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    Vi setter stor pris på om du tar deg tid til å gi oss tilbakemelding på
                    samarbeidet med <strong>${consultant.name}</strong>. Din mening er viktig for oss!
                </p>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="$surveyUrl"
                       style="background-color: #3b82f6; color: white; padding: 16px 32px;
                              text-decoration: none; border-radius: 8px; font-weight: 600;
                              display: inline-block; font-size: 16px;">
                        Svar på undersøkelsen
                    </a>
                </div>

                <p style="color: #718096; font-size: 14px; line-height: 1.6;">
                    Undersøkelsen tar bare 2-3 minutter. Hvis du allerede har svart, kan du se bort fra denne e-posten.
                </p>
            """.trimIndent()
        )
    }

    /**
     * Build complete HTML email with consistent styling.
     */
    private fun buildEmailHtml(title: String, preheader: String, content: String): String {
        return """
            <!DOCTYPE html>
            <html lang="no">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>$title</title>
                <!--[if mso]>
                <style type="text/css">
                    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
                </style>
                <![endif]-->
            </head>
            <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <!-- Preheader text (hidden but shows in email previews) -->
                <div style="display: none; max-height: 0; overflow: hidden;">
                    $preheader
                </div>

                <!-- Email wrapper -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7fafc;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <!-- Email container -->
                            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #1a1a2e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">J</span><span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #eb803c; letter-spacing: -0.5px;">Pro</span>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                                        $content
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                                        <p style="color: #718096; font-size: 14px; margin: 0 0 8px 0;">
                                            JProfessionals AS
                                        </p>
                                        <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                                            Denne e-posten ble sendt som del av vår kundetilfredshetsundersøkelse.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        """.trimIndent()
    }
}
