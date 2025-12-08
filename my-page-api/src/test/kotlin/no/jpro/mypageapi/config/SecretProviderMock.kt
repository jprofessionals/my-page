package no.jpro.mypageapi.config

import no.jpro.mypageapi.provider.SecretProvider
import org.springframework.stereotype.Component


@Component
class SecretProviderMock: SecretProvider {

    override fun getOpenAiApiKey(): String {
        return "mock"
    }

    override fun getTaskSchedulerKey(): String {
        return "mock"
    }

    override fun getSlackSecret(): String {
        return "mock"
    }

    override fun getSlackAppUtlysningerToken(): String {
        return "mock"
    }

    override fun getFlowcaseApiKey(): String {
        return "mock"
    }
}
