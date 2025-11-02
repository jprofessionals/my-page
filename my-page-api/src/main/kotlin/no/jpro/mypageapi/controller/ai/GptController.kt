package no.jpro.mypageapi.controller.ai

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.service.ai.GptConversationService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.*

@RestController
@RequestMapping("openai")
@SecurityRequirement(name = "Bearer Authentication")
class GptController(val conversationService: GptConversationService) {

    @PostMapping("/chat")
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
