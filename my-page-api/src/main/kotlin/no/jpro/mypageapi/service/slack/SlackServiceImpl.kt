package no.jpro.mypageapi.service.slack

import com.slack.api.Slack
import com.slack.api.methods.MethodsClient
import com.slack.api.model.block.SectionBlock
import com.slack.api.model.block.composition.BlockCompositions.markdownText
import com.slack.api.model.block.composition.BlockCompositions.plainText
import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.provider.SecretProvider
import no.jpro.mypageapi.utils.JobPostingUtils.getDeadlineText
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service

@Service
@Profile("gcp")
class SlackServiceImpl(
    private val secretProvider: SecretProvider
) : SlackService {
    @Value("\${slack.hyttekanal.id}")
    private var hytteBookingChannel: String = "NOT_SET"

    private val slack = Slack.getInstance()

    override fun getUserToNotify(
        user: User?
    ): String {
        if (user == null) return "Ukjent bruker"
        val slackId = user.email?.let { getUserIdByEmail(it) }
        return if (slackId != null) "<@$slackId>" else user.name ?: "Ukjent bruker"
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
            .methods(secretProvider.getSlackAppUtlysningerToken())
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
        val token = secretProvider.getSlackSecret()
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

    private fun getUserIdByEmail(email: String): String? {
        val token = secretProvider.getSlackSecret()
        val methods: MethodsClient? = slack.methods(token)
        val response = methods?.usersLookupByEmail { it.email(email) }

        if (response?.isOk == true) {
            return response.user.id
        }
        return null
    }


}


