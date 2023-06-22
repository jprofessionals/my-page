package no.jpro.mypageapi.config

import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import no.jpro.mypageapi.service.ai.GptConversationService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.*

@Component
class GptConversationServiceMock(openAIConsumer: OpenAIConsumer) : GptConversationService(openAIConsumer) {

    private val logger = LoggerFactory.getLogger(GptConversationServiceMock::class.java)

    private final val DEFAULT_MOCK_RESPONSE = "mock"
    private var mockResponses = emptyList<String>()
    private var currentResponseIndex = 0

    fun setMockResponses(responses: List<String>) {
        mockResponses = responses
        currentResponseIndex = 0
    }

    override fun converseWithGpt(message: String, conversationId: UUID): String {
        logger.info(message)

        var response = DEFAULT_MOCK_RESPONSE
        if (mockResponses.isNotEmpty()) {
            response = mockResponses[currentResponseIndex]
            currentResponseIndex = (currentResponseIndex + 1) % mockResponses.size
        }
        return response
    }

}
