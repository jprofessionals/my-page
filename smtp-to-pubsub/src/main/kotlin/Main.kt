import com.google.cloud.pubsub.v1.Publisher
import com.google.protobuf.ByteString
import com.google.pubsub.v1.PubsubMessage
import com.google.pubsub.v1.TopicName
import no.jpro.mypage.RawEmail
import org.apache.avro.io.EncoderFactory
import org.slf4j.LoggerFactory
import org.subethamail.smtp.MessageContext
import org.subethamail.smtp.MessageHandler
import org.subethamail.smtp.MessageHandlerFactory
import org.subethamail.smtp.server.SMTPServer
import org.subethamail.smtp.server.Session
import org.subethamail.smtp.server.SessionHandler
import sun.misc.Signal
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.InetAddress
import java.nio.ByteBuffer
import kotlin.system.exitProcess

fun main() {
    val log = LoggerFactory.getLogger("main")

    val projectId = "my-page-jpro-test"
    val topicId = "email"
    val topicName = TopicName.of(projectId, topicId)
    val publisher: Publisher =
        Publisher.newBuilder(topicName)
            .setEndpoint("europe-west1-pubsub.googleapis.com:443")
            .setEnableMessageOrdering(true)
            .build()

    val server = SMTPServer
        .port(25)
        .bindAddress(InetAddress.getByName("0.0.0.0"))
        .sessionHandler(MySessionHandler())
        .messageHandlerFactory(MyMessageHandlerFactory(publisher))
        .build()
    server.start()

    Runtime.getRuntime().addShutdownHook(Thread {
        server.stop()
    })

    Signal.handle(Signal("INT")) {
        log.info("INT")
        exitProcess(0)
    }
}

class MySessionHandler : SessionHandler {
    private val log = LoggerFactory.getLogger(MySessionHandler::class.java)

    override fun accept(session: Session): SessionHandler.SessionAcceptance {
        log.info("Accepting session from: ${session.realRemoteAddress}")
        return SessionHandler.SessionAcceptance.success()
    }

    override fun onSessionEnd(session: Session) {
        log.info("Ending session from: ${session.realRemoteAddress}")
    }

}

class MyMessageHandlerFactory(
    private val publisher: Publisher,
) : MessageHandlerFactory {
    private val log = LoggerFactory.getLogger(MyMessageHandlerFactory::class.java)

    override fun create(ctx: MessageContext): MessageHandler {
        log.info("Helo: ${ctx.helo}")
        return MyMessageHandler(publisher)
    }
}

class MyMessageHandler(
    private val publisher: Publisher,
) : MessageHandler {

    private val log = LoggerFactory.getLogger(MyMessageHandler::class.java)

    private val fromFilter = Regex("[a-z0-9._\\-]@jpro.no")
    private val toFilter = Regex("utlysninger(-test)?@mail.cr3.me")

    private var from: String? = null
    private val to: MutableList<String> = mutableListOf()
    private var body: ByteArray? = null

    override fun from(from: String) {
        this.from = from
        log.info("From added")
    }

    override fun recipient(recipient: String) {
        this.to.add(recipient)
        log.info("Recipient added")
    }

    override fun data(data: InputStream): String? {
        this.body = data.readAllBytes()
        log.info("Body received. Length: ${this.body?.size}")
        return null
    }

    override fun done() {
        val from = from
        if (from == null) {
            log.info("Ignoring message without FROM")
            return
        }
        if (from.matches(fromFilter)) {
            log.info("Ignoring message without MAIL FROM matching $fromFilter")
            return
        }
        if (to.none { it.matches(toFilter) }) {
            log.info("Ignoring message with no RCPT TO matching $toFilter")
            return
        }
        val email = RawEmail.newBuilder()
            .setFrom(from)
            .setTo(to as List<CharSequence>)
            .setContent(ByteBuffer.wrap(body))
            .build()
        val message = PubsubMessage.newBuilder()
            .setData(ByteString.copyFrom(encodeToAvro(email)))
            .build()
        log.info("Ready to publish message")
        val messageId = publisher.publish(message).get()
        log.info("MAIL FROM: $from")
        to.forEach { log.info("RCPT TO: $it") }
        log.info("---BODY---")
        log.info(body?.toString(Charsets.US_ASCII))
        log.info("---END-BODY---")
        log.info("Done. Message ID: $messageId")
    }

    private fun encodeToAvro(email: RawEmail): ByteArray {
        val byteStream = ByteArrayOutputStream()
        val encoder = EncoderFactory.get().directBinaryEncoder(byteStream, /*reuse=*/ null)
        email.customEncode(encoder)
        encoder.flush()
        return byteStream.toByteArray()
    }
}
