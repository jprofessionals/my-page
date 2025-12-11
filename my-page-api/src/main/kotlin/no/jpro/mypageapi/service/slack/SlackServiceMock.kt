package no.jpro.mypageapi.service.slack

import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.User
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service

@Service
@Profile("!gcp & !railway")
class SlackServiceMock : SlackService {

    override fun getUserToNotify(
        user: User?
    ): String {
        return "<@mock-slack-id>"
    }

    override fun postJobPosting(
        channel: String,
        jobPosting: JobPosting,
        updateMessage: String?
    ) {
    }

    override fun postJobPostingUpdate(
        channel: String,
        jobPosting: JobPosting,
        updateMessage: String,
    ) {
    }

    override fun postMessageToChannel(
        msg: String
    ): String {
        println("[MOCK SLACK] Hytte-kanal: $msg")
        return "Melding sendt til kanal med ID mock-id";
    }

    override fun sendDirectMessage(
        userEmail: String,
        msg: String
    ): String {
        println("[MOCK SLACK] DM til $userEmail: $msg")
        return "Testmelding sendt til $userEmail (mock)"
    }

    override fun postMessageToSalesPipelineChannel(
        msg: String
    ): String {
        println("[MOCK SLACK] Salgstavle: $msg")
        return "Melding sendt til salgstavle-kanal (mock)"
    }

}