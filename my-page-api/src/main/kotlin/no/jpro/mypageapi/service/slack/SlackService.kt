package no.jpro.mypageapi.service.slack

import no.jpro.mypageapi.entity.JobPosting
import no.jpro.mypageapi.entity.User

interface SlackService {

    fun getUserToNotify(
        user: User?
    ): String

    fun postJobPosting(
        channel: String,
        jobPosting: JobPosting,
    )

    fun postMessageToChannel(
        msg: String
    ): String

}