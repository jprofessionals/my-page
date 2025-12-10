package no.jpro.mypageapi.config

import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.storage.Storage
import com.google.cloud.storage.StorageOptions
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import java.io.ByteArrayInputStream

@Configuration
@Profile("railway")
class GcsConfig(
    @Value("\${GOOGLE_APPLICATION_CREDENTIALS_JSON:}") private val credentialsJson: String
) {

    @Bean
    fun storage(): Storage {
        if (credentialsJson.isBlank()) {
            throw IllegalStateException(
                "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. " +
                "Please set it to the contents of your GCP service account JSON key."
            )
        }

        val credentials = GoogleCredentials.fromStream(
            ByteArrayInputStream(credentialsJson.toByteArray())
        )

        return StorageOptions.newBuilder()
            .setCredentials(credentials)
            .build()
            .service
    }
}
