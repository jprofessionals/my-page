package no.jpro.mypageapi.provider

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.integration.annotation.Default
import org.springframework.stereotype.Component

interface SecretProvider {
    fun getOpenAiApiKey(): String
    fun getTaskSchedulerKey(): String
    fun getSlackSecret(): String
    fun getSlackAppUtlysningerToken(): String
}

@Component
@Profile("!gcp")
@Default
class SecretProviderLocal : SecretProvider {
    //For lokal kjøring av AI tjenester, sett denne i for eksempel application-local.yml og legg den til .gitignore så den ikke blir committed
    //kontakt Roger for å få OpenAI API key hvis du ikke har allerede.
    @Value("\${openai.apiKey:NOT_SET}")
    private var apiKey: String = "NOT_SET"

    @Value("\${slack.bot.token:NOT_SET}")
    private val slackBotToken : String = "NOT_SET"

    @Value("\${slack.app.utlysninger.token:NOT_SET}")
    private lateinit var slackAppUtlysningerToken: String

    override fun getOpenAiApiKey(): String {
        return apiKey
    }
    override fun getTaskSchedulerKey(): String {
        return "DUMMY_KEY"
    }

    override fun getSlackSecret(): String {
        return slackBotToken
    }

    override fun getSlackAppUtlysningerToken(): String {
        return slackAppUtlysningerToken
    }
}

@Component
@Profile("gcp")
class SecretProviderGcp : SecretProvider {
    @Value("\${sm://OpenAI_API}")
    private val openAIapiKey: String = "NOT_SET"

    @Value("\${sm://BookingLotteryKey}")//secret heter bookinglottery key av historiske grunner, vil endres etterhvert
    private val taskSchedulerKey: String = "NOT_SET"

    @Value("\${sm://slack_bot_token}")
    private val slackBotToken : String = "NOT_SET"

    @Value("\${sm://slack_app_utlysninger_token}")
    private val slackAppUtlysningerToken: String = "NOT_SET"

    private val logger = LoggerFactory.getLogger(SecretProviderGcp::class.java.name)

    override fun getOpenAiApiKey(): String {
        if(openAIapiKey=="NOT_SET") {
            logger.error("OpenAI API key not set")
        }
        return openAIapiKey
    }

    override fun getTaskSchedulerKey(): String {
        if (taskSchedulerKey == "NOT_SET") {
            throw IllegalStateException("Unable to evaluate authorization key, BookingLotteryKey not set in Secret Manager")
        }
        return taskSchedulerKey
    }

    override fun getSlackSecret(): String {
        if (slackBotToken == "NOT_SET") {
            throw IllegalStateException("Unable to evaluate authorization key, slack_bot_token not set in Secret Manager")
        }
        return slackBotToken
    }

    override fun getSlackAppUtlysningerToken(): String {
        if (slackAppUtlysningerToken == "NOT_SET") {
            throw IllegalStateException("Unable to evaluate authorization key, slack_app_utlysninger_token not set in Secret Manager")
        }
        return slackAppUtlysningerToken
    }
}
