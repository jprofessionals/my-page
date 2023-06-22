package no.jpro.mypageapi.service.ai

import com.aallam.openai.api.BetaOpenAI
import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import com.google.gson.Gson
import no.jpro.explorer.ExplorationChatDTO
import no.jpro.explorer.ExplorationDTO
import no.jpro.explorer.ExplorationRequest
import no.jpro.mypageapi.consumer.ai.GPT_4
import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import org.springframework.stereotype.Component
import java.util.*

@OptIn(BetaOpenAI::class)
@Component
class ExplorationService(
    private val openAIConsumer: OpenAIConsumer,
    private val explorationStatusService: ExplorationStatusService
) {

    fun explore(exploreRequest: ExplorationRequest): ExplorationDTO {
        val sessionId =
                exploreRequest.sessionId.ifBlank {
                    UUID.randomUUID()
                        .toString()
                }

        val explorationHistory = explorationStatusService.getHistory(sessionId)

        return privateExploration(exploreRequest.location, explorationHistory)
    }

    fun reset(sessionId: String) {
        explorationStatusService.reset(sessionId)
    }

    @OptIn(BetaOpenAI::class)
    private fun privateExploration(exploreRequest: String, explorationHistory: ExplorationHistory): ExplorationDTO {
        try {
            val newMessage = ChatMessage(
                role = ChatRole.User,
                content = exploreRequest
            )
            val requestMessages = explorationHistory.messages.toMutableList()
            requestMessages.add(newMessage)

            val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT_4, requestMessages)

            val responsMessage = completion.choices.first().message

            if (responsMessage == null) {
                throw Exception("No response from GPT")
            }


            val explorationDTO = processResponse(responsMessage.content)

            explorationHistory.latestExploration = explorationDTO

            explorationHistory.messages.add(newMessage)
            explorationHistory.messages.add(responsMessage)

            return explorationDTO
        } catch (e: Exception) {
            return ExplorationDTO(
                "Something went wrong, try a different option",
                explorationHistory.latestExploration.imageUrl,
                explorationHistory.latestExploration.nextLocations
            )
        }

    }


    private fun processResponse(exploreResponse: String?): ExplorationDTO {
        if (exploreResponse == null) return ExplorationDTO(
            "No response from GPT",
            "https://labs.openai.com/s/el6z7PeHbgiGbQgiOmCS5oVm",
            listOf()
        )
        val chatResponse = extractJsonFromString(exploreResponse)

        val shortDescription = shortify(chatResponse.description)

        val imageUrl = openAIConsumer.generateImage(shortDescription)

        return ExplorationDTO(
            chatResponse.description,
            imageUrl,
            chatResponse.nextLocations
        )
    }


    @OptIn(BetaOpenAI::class)
    private fun shortify(description: String): String {
        val prompt =
                "Shorten the following description to at most 300 letters, and focus on the visual elements: $description"

        val newMessage = ChatMessage(
            role = ChatRole.User,
            content = prompt
        )

        val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT_4, listOf(newMessage))

        return completion.choices.first().message?.content ?: throw Exception("No response from GPT")
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