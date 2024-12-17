package no.jpro.mypageapi.config

import com.google.api.gax.core.CredentialsProvider
import com.google.api.gax.core.NoCredentialsProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class TestApplicationConfig {

    @Bean
    fun credentialsProvider(): CredentialsProvider = NoCredentialsProvider.create()

}