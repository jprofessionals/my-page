package no.jpro.mypageapi.consumer.ai

import com.aallam.openai.api.BetaOpenAI
import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.model.ModelId
import com.aallam.openai.client.OpenAI
import kotlinx.coroutines.runBlocking
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

const val GPT_3_5_TURBO = "gpt-3.5-turbo"
const val GPT_4 = "gpt-4"

@Service
class OpenAIConsumer(
    //For lokal kjøring, sett denne i for eksempel application-local.yml og legg den til .gitignore så den ikke blir committed
    //kontakt Roger for å få OpenAI API key hvis du ikke har allerede.
    @Value("\${openai.apiKey:PLACEHOLDER}")
    private val apiKey: String
) {
    private val openAI: OpenAI = OpenAI(apiKey)

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