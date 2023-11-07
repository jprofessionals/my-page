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
import java.io.IOException
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

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                logger.error("This request failed: ${imageRequest.prompt}")
                logger.error("Response: ${response.body?.string()}")
                throw IOException("Unexpected code $response")
            }
            val jsonText = response.body?.string()
            val apiResponse: ApiResponse = parseJsonResponse(jsonText ?: "")
            logger.info("Image generated: ${apiResponse.data.firstOrNull()?.url}")
            return apiResponse.data.firstOrNull()?.url ?: throw Exception("No image generated")
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