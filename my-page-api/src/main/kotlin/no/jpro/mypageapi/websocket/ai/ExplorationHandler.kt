package no.jpro.mypageapi.websocket.ai

import com.google.gson.Gson
import no.jpro.explorer.ExplorationRequest
import no.jpro.mypageapi.service.ai.ExplorationService
import no.jpro.mypageapi.utils.GoogleJwtValidator
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.util.logging.Logger


class ExplorationHandler(val explorationService: ExplorationService, val googleJwtValidator: GoogleJwtValidator) : TextWebSocketHandler() {
    private val logger = Logger.getLogger(ExplorationService::class.java.name)
    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val payload = message.payload

        if (session.attributes["token"] == null) {
            session.close(CloseStatus(CloseStatus.PROTOCOL_ERROR.code, "No token received"))
            return
//TODO: don't return
            // verify the token and store it in the session or close the connection if the token is not valid
            if (googleJwtValidator.isValidToken(payload)) {
                session.attributes["token"] = payload
            } else {
                logger.log(java.util.logging.Level.WARNING, "Invalid token received, closing connection")
                session.close(CloseStatus(CloseStatus.PROTOCOL_ERROR.code, "Invalid token"))
            }
        } else if(payload == "reset") {
            explorationService.reset(session.id)
        }

        else {
            val explorationDTO = explorationService.explore(ExplorationRequest(payload, session.id))
            session.sendMessage(TextMessage(Gson().toJson(explorationDTO)))
        }
    }
}
