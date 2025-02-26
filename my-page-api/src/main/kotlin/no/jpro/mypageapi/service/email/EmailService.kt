package no.jpro.mypageapi.service.email

import jakarta.mail.Message
import jakarta.mail.Session
import jakarta.mail.Transport
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeMessage
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.*

@Service
class EmailService (
    @Value("\${notification.jobs.email.sender}") private var sender: String
){

    fun sendMail() {
        val props = Properties()
        val session: Session = Session.getDefaultInstance(props, null)

        try {
            val msg: Message = MimeMessage(session)
            msg.setFrom(InternetAddress(sender, "no-reply"))
            msg.addRecipient(
                Message.RecipientType.TO,
                InternetAddress("matthew@jpro.no", "Matthew Koranda")
            )
            msg.subject = "Test"
            msg.setText("This is a test")
            Transport.send(msg)
        } catch (e: Exception) {
            // ...
        }
    }
}