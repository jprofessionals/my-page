package no.jpro.mypageapi.config

import no.jpro.mypageapi.service.ai.ExplorationService
import no.jpro.mypageapi.utils.GoogleJwtValidator
import no.jpro.mypageapi.websocket.ai.ExplorationHandler
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class WebSocketConfig(val explorationService: ExplorationService, val googleJwtValidator: GoogleJwtValidator) : WebSocketConfigurer{

    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(ExplorationHandler(explorationService, googleJwtValidator), "/explorationSock").setAllowedOriginPatterns("*").withSockJS()
    }

}