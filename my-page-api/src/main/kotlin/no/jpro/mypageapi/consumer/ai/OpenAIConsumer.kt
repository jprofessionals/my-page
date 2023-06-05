package no.jpro.mypageapi.consumer.ai

import com.aallam.openai.api.BetaOpenAI
import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.model.ModelId
import com.aallam.openai.client.OpenAI
import kotlinx.coroutines.runBlocking
import no.jpro.mypageapi.provider.SecretProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

const val GPT_3_5_TURBO = "gpt-3.5-turbo"
const val GPT_4 = "gpt-4"

@Service
class OpenAIConsumer(
    secretProvider: SecretProvider
) {
    private val openAI: OpenAI = OpenAI(secretProvider.getApiKey())

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
}