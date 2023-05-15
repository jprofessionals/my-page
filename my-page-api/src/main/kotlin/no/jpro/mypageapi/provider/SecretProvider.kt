package no.jpro.mypageapi.provider

import com.google.cloud.secretmanager.v1.SecretManagerServiceClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

interface SecretProvider {
    fun getApiKey(): String
}

@Component
@Profile("local")
class SecretProviderLocal: SecretProvider {
    //For lokal kjøring, sett denne i for eksempel application-local.yml og legg den til .gitignore så den ikke blir committed
    //kontakt Roger for å få OpenAI API key hvis du ikke har allerede.
    @Value("\${openai.apiKey:PLACEHOLDER}")
    private var apiKey: String = "PLACEHOLDER"


    override fun getApiKey(): String {
        return apiKey
    }
}


@Profile("gcp")
@Component
class SecretProviderGcp : SecretProvider {
    private var apiKey: String = "PLACEHOLDER"
    private val secretManagerServiceClient: SecretManagerServiceClient = SecretManagerServiceClient.create()

    override fun getApiKey(): String {
        return apiKey
    }
}
