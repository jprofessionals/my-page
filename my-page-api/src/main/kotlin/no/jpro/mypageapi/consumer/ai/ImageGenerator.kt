package no.jpro.mypageapi.consumer.ai

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import no.jpro.mypageapi.provider.SecretProvider
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

@Service
class ImageGenerator(
    val secretProvider: SecretProvider
) {
    private val logger = LoggerFactory.getLogger(ImageGenerator::class.java.name)

    fun generateImage(prompt: String): String {
        logger.info("Generating image with prompt: $prompt")
        val imageRequest = ImageGenerationRequest(
            model = "dall-e-3",
            prompt = prompt,
            n = 1,
            size = "1024x1024"
        )
        val json = Json.encodeToString(imageRequest)
        val jsonBody = json.toRequestBody("application/json; charset=utf-8".toMediaType())

        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(3000, TimeUnit.SECONDS)
            .writeTimeout(3000, TimeUnit.SECONDS)
            .build()
        val apiKey = secretProvider.getOpenAiApiKey()

        val request = Request.Builder()
            .url("https://api.openai.com/v1/images/generations")
            .post(jsonBody)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer $apiKey")
            .build()

        val startedGeneration = System.currentTimeMillis()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                logger.warn("This request failed: ${imageRequest.prompt}")
                val errorText = response.body?.string() ?: "No error text found in response body"
                logger.warn("Response: $errorText")
                if (errorText.contains("content_policy_violation")) {
                    logger.warn("Content policy violation triggered, using fallback image")
                    return "/images/ImageBlockedTooSpicy.webp"
                }
                return "/images/ImageGenerationFailed.webp"
            }
            val jsonText = response.body?.string()
            val apiResponse: ApiResponse = parseJsonResponse(jsonText ?: "")
            val generationTime = String.format("%.1f", (System.currentTimeMillis() - startedGeneration) / 1000.0)
            logger.info("Image generated in ${generationTime} seconds: ${apiResponse.data.firstOrNull()?.url}")

            return apiResponse.data.firstOrNull()?.url ?: "/images/ImageGenerationFailed.webp"
        }
    }
}

fun parseJsonResponse(json: String): ApiResponse {
    return Json.decodeFromString(json)
}

@Serializable
data class ImageGenerationRequest(
    val model: String,
    val prompt: String,
    val n: Int,
    val size: String
)

@Serializable
data class ApiResponse(
    val created: Long,
    val data: List<ImageData>
)

@Serializable
data class ImageData(
    val revised_prompt: String,
    val url: String
)