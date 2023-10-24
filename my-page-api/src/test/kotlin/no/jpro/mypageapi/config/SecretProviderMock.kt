package no.jpro.mypageapi.config

import no.jpro.mypageapi.provider.SecretProvider
import org.springframework.stereotype.Component


@Component
class SecretProviderMock: SecretProvider {

    override fun getOpenAiApiKey(): String {
        return "mock"
    }

    override fun getBookingLotteryKey(): String {
        return "mock"
    }
}
