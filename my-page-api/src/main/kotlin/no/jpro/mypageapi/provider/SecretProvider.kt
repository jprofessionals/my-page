package no.jpro.mypageapi.provider

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

interface SecretProvider {
    fun getApiKey(): String
}

@Component
@Profile("!gcp")
class SecretProviderLocal : SecretProvider {
    //For lokal kjøring av AI tjenester, sett denne i for eksempel application-local.yml og legg den til .gitignore så den ikke blir committed
    //kontakt Roger for å få OpenAI API key hvis du ikke har allerede.
    @Value("\${openai.apiKey:PLACEHOLDER}")
    private var apiKey: String = "PLACEHOLDER"

    override fun getApiKey(): String {
        return apiKey
    }
}

@Component
@Profile("gcp")
class SecretProviderGcp : SecretProvider {
    @Value("\${sm://OpenAI_API}")
    private val apiKey: String = "PLACEHOLDER"

    private val logger = LoggerFactory.getLogger(SecretProviderGcp::class.java.name)

    override fun getApiKey(): String {
        if(apiKey=="PLACEHOLDER") {
            logger.error("OpenAI API key not set")
        }
        return apiKey
    }
}
