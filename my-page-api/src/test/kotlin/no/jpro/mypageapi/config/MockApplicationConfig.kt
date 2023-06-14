package no.jpro.mypageapi.config

import no.jpro.mypageapi.consumer.ai.OpenAIConsumer
import no.jpro.mypageapi.provider.SecretProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary


@Configuration
class MockApplicationConfig {

    @Bean
    @Primary
    fun mockSecretProvider(): SecretProvider {
        return SecretProviderMock()
    }

    @Bean
    @Primary
    fun mockOpenAIConsumer(): OpenAIConsumer {
        return OpenAIConsumerMock(mockSecretProvider())
    }

}