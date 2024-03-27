package no.jpro.mypageapi.service.ai

import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import no.jpro.explorer.ExplorationDTO
val cacheError = ExplorationCacheEntry("ERROR", "ERROR", listOf(), ChatMessage(ChatRole.User, "ERROR"), ChatMessage(ChatRole.User, "ERROR"))

class ExplorationHistory(
    val messages: MutableList<ChatMessage> = mutableListOf(),
    var latestExploration: ExplorationDTO = ExplorationDTO(
        "Welcome to the exploration game! Tell me where you want to go",
        "https://labs.openai.com/s/CccKoaABM4Z3gZhBuipRjtfn",
        listOf("New York", "Paris", "Tokyo", "Oslo")
    )
) {
    val cache: MutableMap<String, ExplorationCacheEntry?> = mutableMapOf()

    init {
        initializeMessages()
    }

    private fun initializeMessages() {
        messages.add(
            ChatMessage(
                role = ChatRole.User,
                content = "Let's play a game, where we explore a location together! I will tell you where we start, either a real world place or a fantasy location, and you will give me a description of that location and a list of 4 places we can go from there. I will then tell you where I go, and you will describe that location and 4 places to go. Try to not get too detailed with the places to go, we want to go broad rather than deep. Also give me a DALL-E 3 prompt to generate an image of the location. The image should be photorealistic and highly detailed, reflecting the locations traits and atmosphere. Format the output like this JSON: \n" +
                        "{\n" +
                        "  \"description\": \"Description of the location\",\n" +
                        "  \"imagePrompt\": \"DALL-E 3 prompt for the location\",\n" +
                        "  \"nextLocations\": [\n" +
                        "    \"next location 1\",\n" +
                        "    \"next location 2\",\n" +
                        "    \"next location 3\",\n" +
                        "    \"next location 4\"\n" +
                        "  ]\n" +
                        "}\n" +
                        "When we're playing only give me the JSON code, no explanation or pleasantries. Continue until I say the game is over."
            )
        )
        messages.add(
            ChatMessage(
                role = ChatRole.Assistant,
                content = "Sure, I'm ready to play! Where shall we start our adventure?"
            )
        )
    }
}

data class ExplorationCacheEntry(
    val description: String,
    val imagePrompt: String,
    val nextLocations: List<String>,
    val requestMsg: ChatMessage,
    val responseMsg: ChatMessage
)
