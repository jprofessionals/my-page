package no.jpro.mypageapi.service.ai

import com.aallam.openai.api.BetaOpenAI
import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import kotlinx.coroutines.runBlocking
import no.jpro.mypageapi.consumer.ai.GPT_3_5_TURBO
import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import org.springframework.stereotype.Service
import java.util.*

@Service
class GptConversationService(
    private val openAIConsumer: OpenAIConsumer
) {

    @OptIn(BetaOpenAI::class)
    private val conversations: MutableMap<UUID, MutableList<ChatMessage>> = mutableMapOf()

    fun converseWithGpt(message: String, conversationId: UUID): String {

        var response: String

        runBlocking {
            response = sendMessageAndConversationHistory(message, conversationId)
        }

        return response
    }

    @OptIn(BetaOpenAI::class)
    private suspend fun sendMessageAndConversationHistory(exploreRequest: String, conversationId: UUID): String {
        val newMessage = ChatMessage(
            role = ChatRole.User,
            content = exploreRequest
        )
        val messages = conversations.getOrPut(conversationId) { mutableListOf() }
        messages.add(newMessage)

        val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT_3_5_TURBO, messages)

        val responsMessage = completion.choices.first().message
        if (responsMessage != null) {
            messages.add(responsMessage)
        }
        return responsMessage?.content.toString()
    }
}