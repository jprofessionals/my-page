package no.jpro.mypageapi.service.ai

import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import com.google.gson.Gson
import no.jpro.explorer.ExplorationChatDTO
import no.jpro.explorer.ExplorationDTO
import no.jpro.explorer.ExplorationRequest
import no.jpro.mypageapi.consumer.ai.GPT4_4_TURBO
import no.jpro.mypageapi.consumer.ai.GPT_3_5_TURBO
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
            if (explorationHistory.cache.containsKey(exploreRequest)) {
                var counter = 0
                while (explorationHistory.cache.getValue(exploreRequest) == null) {
                    Thread.sleep(100)
                    if (counter++ > 400) {
                        logger.warn("Timeout waiting for exploration cache")
                        break
                    }
                }
                if (explorationHistory.cache.getValue(exploreRequest) != null) {
                    if (explorationHistory.cache.getValue(exploreRequest) != cacheError) {
                        val cachedDto = explorationHistory.cache[exploreRequest]!!
                        val imageUrl = imageGenerator.generateImage(cachedDto.description)
                        val explorationDTO = ExplorationDTO(
                            cachedDto.description,
                            imageUrl,
                            cachedDto.nextLocations
                        )

                        explorationHistory.messages.add(cachedDto.requestMsg)
                        explorationHistory.messages.add(cachedDto.responseMsg)
                        explorationHistory.latestExploration = explorationDTO

                        startAsyncCache(cachedDto.nextLocations, artStyle, explorationHistory)

                        return explorationDTO
                    }
                }
            }
        } catch (e: NoSuchElementException) {
            logger.warn("Cached value removed while waiting for it to be populated")
        }
        logger.info("$exploreRequest not found in cache, continuing with GPT request")
        try {
            val newMessage = ChatMessage(
                role = ChatRole.User,
                content = exploreRequest
            )
            val requestMessages = explorationHistory.messages.toMutableList()
            requestMessages.add(newMessage)

            val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT4_4_TURBO, requestMessages)

            val responseMessage = completion.choices.first().message

            val explorationDTO = processResponse(responseMessage.content, artStyle, explorationHistory)
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


    private fun processResponse(
        exploreResponse: String?,
        artStyle: String,
        explorationHistory: ExplorationHistory
    ): ExplorationDTO {
        if (exploreResponse == null) return ExplorationDTO(
            "No response from GPT",
            "https://labs.openai.com/s/el6z7PeHbgiGbQgiOmCS5oVm",
            listOf()
        )
        val chatResponse = extractJsonFromString(exploreResponse)

        startAsyncCache(chatResponse.nextLocations, artStyle, explorationHistory)

        val shortDescription = shortify(chatResponse.description, artStyle)
        val imageUrl = imageGenerator.generateImage(shortDescription)

        return ExplorationDTO(
            chatResponse.description,
            imageUrl,
            chatResponse.nextLocations
        )
    }

    private fun startAsyncCache(nextLocations: List<String>, artStyle: String, explorationHistory: ExplorationHistory) {

        for (location in nextLocations) {
            explorationHistory.cache[location] = null
            logger.info("Starting to cache $location")
            //Start a thread for each location, and cache the result
            Thread {
                try {
                    val newMessage = ChatMessage(
                        role = ChatRole.User,
                        content = location
                    )
                    val requestMessages = explorationHistory.messages.toMutableList()
                    requestMessages.add(newMessage)

                    val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT4_4_TURBO, requestMessages)

                    val responseMessage = completion.choices.first().message.content
                    if (responseMessage == null) {
                        logger.warn("No response from GPT for $location")
                        explorationHistory.cache[location] = cacheError
                    }

                    val extractedDto = extractJsonFromString(responseMessage!!)

                    val result = ExplorationCacheEntry(
                        extractedDto.description,
                        shortify(extractedDto.description, artStyle),
                        extractedDto.nextLocations,
                        newMessage,
                        completion.choices.first().message
                    )

                    explorationHistory.cache[location] = result
                    logger.info("Finished caching of $location")
                } catch (e: Exception) {
                    logger.warn("Error ChatGPT GPT:", e)
                    explorationHistory.cache[location] = cacheError
                }
            }.start()
        }
    }


    private fun shortify(description: String, style: String = "an ultra-realistic picture"): String {
        val prompt = "Generate a DALL-E 3 prompt for $style of this scene: $description"
        val newMessage = ChatMessage(
            role = ChatRole.User,
            content = prompt
        )

        val completion: ChatCompletion = openAIConsumer.chatCompletion(GPT_3_5_TURBO, listOf(newMessage))

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