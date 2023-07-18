package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.consumer.slack.SlackConsumer
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("slack")
@SecurityRequirement(name = "Bearer Authentication")
class SlackController(private val slackConsumer: SlackConsumer) {

    @Operation(summary = "Send en melding til en Slack-kanal")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Melding sendt"),
        ApiResponse(responseCode = "500", description = "Feil ved sending av melding")
    ])
    @PostMapping("/message")
    fun postMessage(@RequestParam message: String): ResponseEntity<String> {
        val responseMessage = slackConsumer.postMessageToChannel(message)
        return when {
            responseMessage.startsWith("Melding sendt til kanal med ID") -> ResponseEntity.ok(responseMessage)
            responseMessage == "Response == null!" -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseMessage)
            else -> ResponseEntity.badRequest().body(responseMessage)
        }
    }
}
