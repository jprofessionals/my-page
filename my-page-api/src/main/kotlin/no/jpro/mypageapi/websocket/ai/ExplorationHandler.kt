package no.jpro.mypageapi.websocket.ai


import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import no.jpro.explorer.ExplorationRequest
import no.jpro.mypageapi.service.ai.ExplorationService
import no.jpro.mypageapi.utils.GoogleJwtValidator
import org.slf4j.LoggerFactory
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler


private const val EXPLORE = "explore:"

class ExplorationHandler(
    private val explorationService: ExplorationService,
    private val googleJwtValidator: GoogleJwtValidator
) :
    TextWebSocketHandler() {
    private val logger = LoggerFactory.getLogger(ExplorationHandler::class.java.name)

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val payload = message.payload
        if (session.attributes["token"] == null) {
            // verify the token and store it in the session or close the connection if the token is not valid
            if (googleJwtValidator.isValidToken(payload)) {
                session.attributes["token"] = payload
            } else {
                logger.warn("Invalid token received, closing connection")
                session.close(CloseStatus(CloseStatus.PROTOCOL_ERROR.code, "Invalid token"))
            }
        } else if (payload == "reset") {
            explorationService.reset(session.id)
        } else if (payload.startsWith(EXPLORE)) {
            val explorationInput = Json.decodeFromString<ExplorationInput>(payload.removePrefix(EXPLORE))
            val explorationDTO = explorationService.explore(
                ExplorationRequest(
                    explorationInput.location,
                    explorationInput.artStyle,
                    session.id
                )
            )
            session.sendMessage(TextMessage(Json.encodeToString(explorationDTO)))
        } else {
            logger.info("Received unknown websocket message: $payload")
        }
    }
}

@Serializable
data class ExplorationInput(
    val location: String,
    val artStyle: String
)
