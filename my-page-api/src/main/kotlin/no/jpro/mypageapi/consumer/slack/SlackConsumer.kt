package no.jpro.mypageapi.consumer.slack

import com.slack.api.Slack
import com.slack.api.methods.MethodsClient
import no.jpro.mypageapi.provider.SlackSecretProvider
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class SlackConsumer(private val slackSecretProvider: SlackSecretProvider) {

    private val slack = Slack.getInstance()

    fun postMessageToChannel(
        userOwner: String,
        userRequested: String,
        startDate: LocalDate,
        endDate: LocalDate
    ): String {

        return postMessageToChannel("Kjære $userOwner, $userRequested ønsker også å booke i tidsrommet fra $startDate til $endDate")
    }

    fun postMessageToChannel(msg: String): String {

        val token = slackSecretProvider.getSlackSecret()
        val methods: MethodsClient? = slack.methods(token)
        val channelId = "C05HJ96ACLA"
        val response = methods?.chatPostMessage {
            it
                .channel(channelId)
                .text(msg)
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
}


