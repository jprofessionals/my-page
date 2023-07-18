package no.jpro.mypageapi.provider

import com.google.cloud.secretmanager.v1.SecretManagerServiceClient
import com.google.cloud.secretmanager.v1.SecretVersionName
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class SlackSecretProvider {

    private val secretId = "slack_bot_token"

    fun getSlackSecret(@Value("\${gcp.projectid}") projectId: String = "my-page-jpro"): String {
        SecretManagerServiceClient.create().use { client ->
            val secretVersionName = SecretVersionName.of(projectId, secretId, "latest")
            val response = client.accessSecretVersion(secretVersionName)

            return response.payload.data.toStringUtf8()

        }

    }

}