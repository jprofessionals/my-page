package no.jpro.mypageapi.service

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import no.jpro.mypageapi.dto.FlowcaseUserDTO
import no.jpro.mypageapi.provider.SecretProvider
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

@Service
class FlowcaseService(
    private val secretProvider: SecretProvider,
    @Value("\${flowcase.subdomain:jpro}") private val subdomain: String
) {
    private val logger = LoggerFactory.getLogger(FlowcaseService::class.java)

    private val restClient: RestClient by lazy {
        val apiKey = secretProvider.getFlowcaseApiKey()
        val baseUrl = "https://$subdomain.flowcase.com/api/v2"
        logger.info("Initializing Flowcase RestClient:")
        logger.info("  - Base URL: $baseUrl")
        logger.info("  - API key present: ${apiKey != "NOT_SET" && apiKey.isNotBlank()}")
        logger.info("  - API key length: ${apiKey.length}")
        logger.info("  - API key first 4 chars: ${apiKey.take(4)}...")
        logger.info("  - API key last 4 chars: ...${apiKey.takeLast(4)}")
        if (apiKey == "NOT_SET" || apiKey.isBlank()) {
            logger.warn("Flowcase API key is not configured!")
        }
        RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer $apiKey")
            .build()
    }

    /**
     * Fetches all active users (consultants) from Flowcase
     */
    fun getConsultants(): List<FlowcaseUserDTO> {
        return try {
            val users = mutableListOf<FlowcaseUserResponse>()
            var offset = 0
            val limit = 100

            // Paginate through all users
            do {
                val response = restClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/users/search")
                            .queryParam("offset", offset)
                            .queryParam("limit", limit)
                            .build()
                    }
                    .retrieve()
                    .body(object : ParameterizedTypeReference<List<FlowcaseUserResponse>>() {})
                    ?: emptyList()

                users.addAll(response)
                offset += limit
            } while (response.size == limit)

            logger.info("Fetched ${users.size} consultants from Flowcase")

            users
                .filter { !it.deactivated }
                .map { user ->
                    FlowcaseUserDTO(
                        id = user.id,
                        email = user.email,
                        name = user.name,
                        imageUrl = user.image?.url,
                        deactivated = user.deactivated
                    )
                }
                .sortedBy { it.name?.lowercase() }
        } catch (e: RestClientException) {
            logger.error("Failed to fetch consultants from Flowcase: ${e.message}", e)
            emptyList()
        } catch (e: Exception) {
            logger.error("Failed to fetch consultants from Flowcase", e)
            emptyList()
        }
    }

    /**
     * Search consultants by name or email
     */
    fun searchConsultants(query: String): List<FlowcaseUserDTO> {
        val allConsultants = getConsultants()
        val lowerQuery = query.lowercase()

        return allConsultants.filter { user ->
            user.name?.lowercase()?.contains(lowerQuery) == true ||
            user.email?.lowercase()?.contains(lowerQuery) == true
        }
    }
}

@JsonIgnoreProperties(ignoreUnknown = true)
data class FlowcaseUserResponse(
    val id: String,
    val email: String? = null,
    val name: String? = null,
    val deactivated: Boolean = false,
    val image: FlowcaseImage? = null,
    @JsonProperty("default_cv_id")
    val defaultCvId: String? = null
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class FlowcaseImage(
    val url: String? = null
)
