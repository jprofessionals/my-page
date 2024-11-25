package no.jpro.mypageapi.service.slack

import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.User
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service

@Service
@Profile("!gcp")
class SlackServiceMock : SlackService {

    override fun getUserToNotify(
        user: User?
    ): String {
        return "<@mock-slack-id>"
    }

    override fun postJobPosting(
        channel: String,
        jobPosting: JobPosting
    ) {
    }

    override fun postMessageToChannel(
        msg: String
    ): String {
        return "Melding sendt til kanal med ID mock-id";
    }

}