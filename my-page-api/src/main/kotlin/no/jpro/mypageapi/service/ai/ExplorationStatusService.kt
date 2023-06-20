package no.jpro.mypageapi.service.ai

import com.aallam.openai.api.BetaOpenAI
import org.springframework.stereotype.Component


@Component
class ExplorationStatusService {
    private val history = mutableMapOf<String, ExplorationHistory>()

    @OptIn(BetaOpenAI::class)
    fun getHistory(conversationId: String): ExplorationHistory {
        return history.getOrPut(conversationId) { ExplorationHistory() }
    }

    @OptIn(BetaOpenAI::class)
    fun reset(sessionId: String) {
        history[sessionId] = ExplorationHistory()
    }
}
