package no.jpro.mypageapi.service.email

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service


@Service
class EmailService (
    @Value("\${notification.jobs.email.sender}") private var sender: String,
    @Value("\${spring.mail.password}") private var passsword: String,
    private val emailSender: JavaMailSender
){
    private val logger = LoggerFactory.getLogger(EmailService::class.java.name)

    fun sendSimpleMessage(to: String, subject: String, text: String) {
        val message = SimpleMailMessage()
        message.from = sender
        message.setTo(to)
        message.subject = subject
        message.text = text
        logger.info("Sending message $message")

        emailSender.send(message)
    }
}