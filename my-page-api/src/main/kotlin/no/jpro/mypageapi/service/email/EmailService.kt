package no.jpro.mypageapi.service.email

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service


@Service
class EmailService (
    @Value("\${notification.jobs.email.sender}") private var sender: String,
    private val emailSender: JavaMailSender
){
    private val logger = LoggerFactory.getLogger(EmailService::class.java.name)

    fun sendSimpleMessage(to: String, subject: String, text: String) {
        val message = emailSender.createMimeMessage()
        val helper = MimeMessageHelper(message)

        helper.setFrom(sender)
        helper.setTo(to)
        helper.setSubject(subject)
        helper.setText(text, true)
        logger.info("Sending message $message")

        emailSender.send(message)
    }
}