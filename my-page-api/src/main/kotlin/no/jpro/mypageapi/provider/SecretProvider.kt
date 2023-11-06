package no.jpro.mypageapi.provider

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

interface SecretProvider {
    fun getOpenAiApiKey(): String
    fun getBookingLotteryKey(): String
}

@Component
@Profile("!gcp")
class SecretProviderLocal : SecretProvider {
    //For lokal kjøring av AI tjenester, sett denne i for eksempel application-local.yml og legg den til .gitignore så den ikke blir committed
    //kontakt Roger for å få OpenAI API key hvis du ikke har allerede.
    @Value("\${openai.apiKey:PLACEHOLDER}")
    private var apiKey: String = "PLACEHOLDER"

    override fun getOpenAiApiKey(): String {
        return apiKey
    }
    override fun getBookingLotteryKey(): String {
        return "DUMMY_KEY"
    }
}

@Component
@Profile("gcp")
class SecretProviderGcp : SecretProvider {
    @Value("\${sm://OpenAI_API}")
    private val openAIapiKey: String = "PLACEHOLDER"

    @Value("\${sm://BookingLotteryKey}")
    private val bookingLotteryKey: String = "NOT_SET"


    private val logger = LoggerFactory.getLogger(SecretProviderGcp::class.java.name)

    override fun getOpenAiApiKey(): String {
        if(openAIapiKey=="PLACEHOLDER") {
            logger.error("OpenAI API key not set")
        }
        return openAIapiKey
    }

    override fun getBookingLotteryKey(): String {
        if (bookingLotteryKey == "NOT_SET") {
            throw IllegalStateException("Unable to evaluate authorization key, BookingLotteryKey not set in Secret Manager")
        }
        return bookingLotteryKey
    }
}
