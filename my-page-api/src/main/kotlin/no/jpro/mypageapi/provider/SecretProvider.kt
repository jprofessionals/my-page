package no.jpro.mypageapi.provider

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

interface SecretProvider {
    fun getApiKey(): String
}

@Component
@Profile("local", "h2")
class SecretProviderLocal: SecretProvider {
    //For lokal kjøring, sett denne i for eksempel application-local.yml og legg den til .gitignore så den ikke blir committed
    //kontakt Roger for å få OpenAI API key hvis du ikke har allerede.
    @Value("\${openai.apiKey:PLACEHOLDER}")
    private var apiKey: String = "PLACEHOLDER"


    override fun getApiKey(): String {
        return apiKey
    }
}

@Component
@Profile("!local", "!h2" ) //Midlertidig løsning for å få deployet til GCP
class SecretProviderGcp : SecretProvider {
    @Value("\${OpenAI_API:PLACEHOLDER}")
    private val apiKey: String = "PLACEHOLDER"

    override fun getApiKey(): String {
        return apiKey
    }
}
