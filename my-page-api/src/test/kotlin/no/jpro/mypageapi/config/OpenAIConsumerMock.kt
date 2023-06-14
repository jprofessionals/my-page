package no.jpro.mypageapi.config

import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import no.jpro.mypageapi.provider.SecretProvider
import org.springframework.stereotype.Component


@Component
class OpenAIConsumerMock(secretProvider: SecretProvider) : OpenAIConsumer(secretProvider) {
}