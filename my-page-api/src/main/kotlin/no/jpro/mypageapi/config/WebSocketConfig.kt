package no.jpro.mypageapi.config

import no.jpro.mypageapi.service.ai.ExplorationService
import no.jpro.mypageapi.utils.GoogleJwtValidator
import no.jpro.mypageapi.websocket.ai.ExplorationHandler
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class WebSocketConfig(val explorationService: ExplorationService, val googleJwtValidator: GoogleJwtValidator) : WebSocketConfigurer{

    private val logger = LoggerFactory.getLogger(WebSocketConfig::class.java.name)

    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        logger.info("Registering ExplorationHandler")
        System.out.println("registering ExplorationHandler!")

        registry.addHandler(ExplorationHandler(explorationService, googleJwtValidator), "/explorationSock").setAllowedOriginPatterns("*").withSockJS()
    }

}