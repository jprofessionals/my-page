package no.jpro.mypageapi.service.ai

import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import com.google.gson.Gson
import no.jpro.explorer.ExplorationChatDTO
import no.jpro.explorer.ExplorationDTO
import no.jpro.explorer.ExplorationRequest
import no.jpro.mypageapi.consumer.ai.GPT4_4_TURBO
import no.jpro.mypageapi.consumer.ai.ImageGenerator
import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.*

@Component
class ExplorationService(
    private val openAIConsumer: OpenAIConsumer,
    private val imageGenerator: ImageGenerator,
    private val explorationStatusService: ExplorationStatusService
) {

    private val logger = LoggerFactory.getLogger(ExplorationService::class.java.name)

    fun explore(exploreRequest: ExplorationRequest): ExplorationDTO {
        val sessionId =
            exploreRequest.sessionId.ifBlank {
                UUID.randomUUID()
                    .toString()
            }

        val explorationHistory = explorationStatusService.getHistory(sessionId)

        return privateExploration(exploreRequest.location, exploreRequest.artStyle, explorationHistory)
    }

    fun reset(sessionId: String) {
        explorationStatusService.reset(sessionId)
    }

    private fun privateExploration(exploreRequest: String, artStyle: String, explorationHistory: ExplorationHistory): ExplorationDTO {
        try {
            val newMessage = ChatMessage(
                role = ChatRole.User,
                content = exploreRequest
            )
            val requestMessages = explorationHistory.messages.toMutableList()
            requestMessages.add(newMessage)

            val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT4_4_TURBO, requestMessages)

            val responseMessage = completion.choices.first().message

            val explorationDTO = processResponse(responseMessage.content, artStyle)

            explorationHistory.latestExploration = explorationDTO

            explorationHistory.messages.add(newMessage)
            explorationHistory.messages.add(responseMessage)

            return explorationDTO
        } catch (e: Exception) {
            logger.error("Error ChatGPT GPT:", e)
            return ExplorationDTO(
                "Something went wrong, try a different option",
                explorationHistory.latestExploration.imageUrl,
                explorationHistory.latestExploration.nextLocations
            )
        }

    }


    private fun processResponse(exploreResponse: String?, artStyle: String): ExplorationDTO {
        if (exploreResponse == null) return ExplorationDTO(
            "No response from GPT",
            "https://labs.openai.com/s/el6z7PeHbgiGbQgiOmCS5oVm",
            listOf()
        )
        val chatResponse = extractJsonFromString(exploreResponse)

        val shortDescription = shortify(chatResponse.description, artStyle)
        val imageUrl = imageGenerator.generateImage(shortDescription)

        return ExplorationDTO(
            chatResponse.description,
            imageUrl,
            chatResponse.nextLocations
        )
    }


    private fun shortify(description: String, style: String = "an ultra-realistic picture"): String {
        val prompt = "Generate a DALL-E 3 prompt for $style of this scene: $description"
        val newMessage = ChatMessage(
            role = ChatRole.User,
            content = prompt
        )

        val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT4_4_TURBO, listOf(newMessage))

        return completion.choices.first().message.content ?: throw Exception("No response from GPT")
    }

    fun extractJsonFromString(input: String): ExplorationChatDTO {
        val startIndex = input.indexOf("{")
        val endIndex = input.lastIndexOf("}")
        if (startIndex == -1 || endIndex == -1) {
            println("*********************ERROR*********************")
            println(input)
            println()
            throw Exception("No json found in response")
        }
        val jsonString = input.substring(startIndex, endIndex + 1)

        return Gson().fromJson(jsonString, ExplorationChatDTO::class.java)
    }

    fun default(): ExplorationDTO {
        return ExplorationDTO(
            "Welcome to the exploration game! Tell me where you want to go",
            "https://labs.openai.com/s/CccKoaABM4Z3gZhBuipRjtfn",
            listOf("New York", "Paris", "Tokyo", "Oslo")
        )

    }
}