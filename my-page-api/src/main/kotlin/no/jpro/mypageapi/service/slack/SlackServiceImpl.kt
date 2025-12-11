package no.jpro.mypageapi.service.slack

import com.slack.api.Slack
import com.slack.api.methods.MethodsClient
import com.slack.api.model.block.SectionBlock
import com.slack.api.model.block.composition.BlockCompositions.markdownText
import com.slack.api.model.block.composition.BlockCompositions.plainText
import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.provider.SecretProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.*

@Service
@Profile("gcp", "railway")
class SlackServiceImpl(
    private val secretProvider: SecretProvider
) : SlackService {
    private val logger = org.slf4j.LoggerFactory.getLogger(SlackServiceImpl::class.java)
    @Value("\${slack.hyttekanal.id}")
    private var hytteBookingChannel: String = "NOT_SET"

    @Value("\${slack.salgstavle.id:NOT_SET}")
    private var salesPipelineChannel: String = "NOT_SET"

    private val slack = Slack.getInstance()

    override fun getUserToNotify(
        user: User?
    ): String {
        if (user == null) return "Ukjent bruker"
        val email = user.email
        if (email == null) {
            logger.warn("User ${user.name} has no email, cannot look up Slack ID")
            return user.name ?: "Ukjent bruker"
        }
        val slackId = getUserIdByEmail(email)
        if (slackId == null) {
            logger.warn("Could not find Slack ID for user ${user.name} with email $email")
            return user.name ?: "Ukjent bruker"
        }
        return "<@$slackId>"
    }

    override fun postJobPosting(
        channel: String,
        jobPosting: JobPosting,
        updateMessage: String?,
    ) {
        val title = if (updateMessage == null) {
            jobPosting.title
        } else {
            "OPPDATERING - ${jobPosting.title}"
        }

        val blocks = mutableListOf(
            SectionBlock.builder().text(
                markdownText("<https://minside.jpro.no/utlysninger?id=${jobPosting.id}|*${title}*>")

            ).build(),
            SectionBlock.builder().fields(
                listOf(
                    markdownText("*Kunde:* ${jobPosting.customer.name}"),
                    markdownText(
                        "*Frist:* ${getDeadlineText(jobPosting)}"
                    ),
                )
            ).build(),
            SectionBlock.builder().text(
                markdownText("*Tagger:* ${jobPosting.tags.map { tag -> tag.name }.joinToString(", ")}")
            ).build(),
        )

        if (updateMessage != null) {
            blocks.add(
                1,
                SectionBlock.builder().text(
                    plainText(updateMessage)
                ).build(),
            )
        }

        val response = slack
            .methods(secretProvider.getSlackToken())
            .chatPostMessage {
                it.channel(channel).blocks(
                    blocks.toList()
                )
            }

        if (!response.isOk) {
            throw RuntimeException("Failed to post message to Slack: ${response.error}")
        }
    }

    override fun postJobPostingUpdate(
        channel: String,
        jobPosting: JobPosting,
        updateMessage: String
    ) {
        postJobPosting(
            channel,
            jobPosting,
            updateMessage
        )
    }

    override fun postMessageToChannel(
        msg: String
    ): String {
        val token = secretProvider.getSlackToken()
        val channelId = hytteBookingChannel
        val methods: MethodsClient? = slack.methods(token)
        val response = methods?.chatPostMessage {
            it.channel(channelId).text(msg)
        }

        if (response != null) {
            if (response.isOk) {
                return "Melding sendt til kanal med ID ${response.channel}";

            } else {

                return "Feil ved sending av melding: ${response.error}\n\n ${response.errors}"

            }
        }

        return "Response == null!"
    }

    override fun sendDirectMessage(
        userEmail: String,
        msg: String
    ): String {
        val slackUserId = getUserIdByEmail(userEmail)
            ?: return "Kunne ikke finne Slack-bruker for $userEmail"

        val token = secretProvider.getSlackToken()
        val methods: MethodsClient? = slack.methods(token)
        val response = methods?.chatPostMessage {
            it.channel(slackUserId).text(msg)
        }

        if (response != null) {
            if (response.isOk) {
                return "Testmelding sendt til deg på Slack"
            } else {
                return "Feil ved sending av DM: ${response.error}"
            }
        }
        return "Response == null!"
    }

    override fun postMessageToSalesPipelineChannel(
        msg: String
    ): String {
        if (salesPipelineChannel == "NOT_SET") {
            return "Salgstavle-kanal er ikke konfigurert"
        }
        val token = secretProvider.getSlackToken()
        val methods: MethodsClient? = slack.methods(token)
        val response = methods?.chatPostMessage {
            it.channel(salesPipelineChannel).text(msg)
        }

        if (response != null) {
            if (response.isOk) {
                return "Melding sendt til salgstavle-kanal"
            } else {
                return "Feil ved sending av melding: ${response.error}\n\n ${response.errors}"
            }
        }

        return "Response == null!"
    }

    private fun getUserIdByEmail(email: String): String? {
        val token = secretProvider.getSlackToken()
        val methods: MethodsClient? = slack.methods(token)
        val response = methods?.usersLookupByEmail { it.email(email) }

        if (response?.isOk == true) {
            return response.user.id
        }
        logger.warn("Slack usersLookupByEmail failed for $email: ${response?.error}")
        return null
    }

    private fun getDeadlineText(
        jobPosting: JobPosting
    ): String {
        if (jobPosting.urgent) {
            return "ASAP"
        } else {
            return jobPosting.deadline
                ?.atZoneSameInstant(ZoneId.of("Europe/Oslo"))
                ?.format(
                    DateTimeFormatter.ofPattern(
                        "dd. MMMM yyyy HH:mm",
                        Locale.forLanguageTag("no-NO")
                    )
                ) ?: "Ingen frist"
        }
    }

}


