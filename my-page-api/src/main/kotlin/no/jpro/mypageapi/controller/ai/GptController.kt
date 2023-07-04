package no.jpro.mypageapi.controller.ai

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.service.ai.GptConversationService
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("openai")
@SecurityRequirement(name = "Bearer Authentication")
class GptController(val conversationService: GptConversationService) {

    @PostMapping("/chat")
    @Transactional
    @Operation(summary = "Chat with GPT", description = "Converse with the GPT model")
    fun chatWithGpt(
        @RequestBody
        @Parameter(description = "Message to send to GPT model")
        message: String,
        @Parameter(description = "Conversation ID")
        @RequestParam("conversationId")
        conversationId: UUID
    ): String {
        if (message.isBlank() || message == "\"\"") {
            return "ERROR: GPT input is blank"
        }
        return conversationService.converseWithGpt(message, conversationId)
    }
}