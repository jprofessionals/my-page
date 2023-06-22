package no.jpro.mypageapi.consumer.ai

import com.aallam.openai.api.BetaOpenAI
import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.image.ImageCreation
import com.aallam.openai.api.image.ImageSize
import com.aallam.openai.api.model.ModelId
import com.aallam.openai.client.OpenAI
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import no.jpro.mypageapi.provider.SecretProvider
import org.springframework.stereotype.Service

const val GPT_3_5_TURBO = "gpt-3.5-turbo"
const val GPT_4 = "gpt-4"

@Service
class OpenAIConsumer(
    val secretProvider: SecretProvider
) {
    private var openAI: OpenAI = OpenAI(secretProvider.getApiKey())

    @OptIn(BetaOpenAI::class)
    fun chatCompletion(model: String, messages: List<ChatMessage>): ChatCompletion {
        val completionRequest = ChatCompletionRequest(
            model = ModelId(model),
            messages = messages
        )

        return runBlocking {
            val completion: ChatCompletion = openAI.chatCompletion(completionRequest)
            completion
        }
    }

    @OptIn(BetaOpenAI::class)
    fun generateImage(shortDescription: String): String {
        val deferred = GlobalScope.async {
            val prompt = "3D render, realistic, $shortDescription"
            val images = openAI.imageURL(
                creation = ImageCreation(
                    prompt = prompt,
                    n = 1,
                    size = ImageSize.is1024x1024
                )
            )
            images.firstOrNull() ?: throw Exception("No image generated")
        }
        return runBlocking { deferred.await().url }
    }
}
