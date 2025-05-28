package no.jpro.mypageapi.service.ai

import com.aallam.openai.api.BetaOpenAI
import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import kotlinx.coroutines.runBlocking
import no.jpro.mypageapi.consumer.ai.GPT_4o
import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import org.springframework.stereotype.Component

@Component
class ConversationService(
    private val openAIConsumer: OpenAIConsumer
) {

    @OptIn(BetaOpenAI::class)
    private val messages = mutableListOf<ChatMessage>()

    fun converse(exploreRequest: String): String {

        var response: String

        runBlocking {
            response = privateConversation(exploreRequest)
        }

        return response
    }

    @OptIn(BetaOpenAI::class)
    private suspend fun privateConversation(exploreRequest: String): String {
        val newMessage = ChatMessage(
            role = ChatRole.User,
            content = exploreRequest
        )
        messages.add(newMessage)

        val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT_4o, messages)

        val responsMessage = completion.choices.first().message
        if (responsMessage != null) {
            messages.add(responsMessage)
        }
        return responsMessage?.content.toString()
    }
}
