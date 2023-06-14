package no.jpro.mypageapi.event

data class PubSubMessage(
    val data: String,
    val attributes: Map<String, String>,
    val messageId: String,
    val publishTime: String,
)
