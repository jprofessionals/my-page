package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.kti.*
import no.jpro.mypageapi.model.PublicSurveyData
import no.jpro.mypageapi.model.PublicSurveyQuestion
import no.jpro.mypageapi.model.SurveyResponseItem
import no.jpro.mypageapi.model.KtiQuestionType as ModelKtiQuestionType
import no.jpro.mypageapi.repository.KtiInvitationRepository
import no.jpro.mypageapi.repository.KtiResponseRepository
import no.jpro.mypageapi.repository.KtiRoundQuestionRepository
import no.jpro.mypageapi.repository.KtiQuestionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class KtiPublicSurveyService(
    private val invitationRepository: KtiInvitationRepository,
    private val responseRepository: KtiResponseRepository,
    private val roundQuestionRepository: KtiRoundQuestionRepository,
    private val questionRepository: KtiQuestionRepository
) {
    private val logger = LoggerFactory.getLogger(KtiPublicSurveyService::class.java)

    /**
     * Get survey data for a respondent by their unique token.
     * Returns null if the token is invalid or expired.
     */
    @Transactional
    fun getSurveyByToken(token: String): PublicSurveyData? {
        val invitation = invitationRepository.findByToken(token)
        if (invitation == null) {
            logger.warn("Survey not found for token: ${token.take(8)}...")
            return null
        }

        // Check if survey is expired
        if (invitation.expiresAt != null && LocalDateTime.now().isAfter(invitation.expiresAt)) {
            logger.warn("Survey expired for token: ${token.take(8)}...")
            return null
        }

        val assignment = invitation.assignment
        val round = assignment.round
        val consultant = assignment.consultant
        val contact = assignment.contact
        val organization = contact?.organization

        // Check if round is open for responses
        if (round.status != KtiRoundStatus.OPEN) {
            logger.warn("Survey round is not open (status: ${round.status}) for token: ${token.take(8)}...")
            return null
        }

        // Get active questions for this round
        val roundQuestions = roundQuestionRepository.findByRoundIdAndActiveOrderByDisplayOrder(round.id!!, true)

        // Mark as opened if this is the first time
        if (invitation.openedAt == null) {
            val updated = invitation.copy(
                openedAt = LocalDateTime.now(),
                status = if (invitation.status == KtiInvitationStatus.PENDING || invitation.status == KtiInvitationStatus.SENT) {
                    KtiInvitationStatus.OPENED
                } else invitation.status
            )
            invitationRepository.save(updated)
            logger.info("Survey opened for token: ${token.take(8)}...")
        }

        val alreadyResponded = invitation.status == KtiInvitationStatus.RESPONDED ||
            invitation.respondedAt != null

        return PublicSurveyData(
            surveyName = round.name,
            year = round.year,
            consultantName = consultant.name ?: "Ukjent konsulent",
            organizationName = organization?.name ?: "Ukjent organisasjon",
            questions = roundQuestions.map { rq ->
                val q = rq.question
                PublicSurveyQuestion(
                    id = q.id!!,
                    code = q.code,
                    text = q.textNo,
                    questionType = ModelKtiQuestionType.valueOf(q.questionType.name),
                    category = q.category,
                    displayOrder = rq.displayOrder,
                    required = q.required
                )
            },
            alreadyResponded = alreadyResponded
        )
    }

    /**
     * Submit survey responses.
     * Returns true if successful, false if survey is invalid, expired, or already completed.
     * Throws an exception if there's a validation error.
     */
    @Transactional
    fun submitResponses(token: String, responses: List<SurveyResponseItem>): SubmitResult {
        val invitation = invitationRepository.findByToken(token)
        if (invitation == null) {
            logger.warn("Survey not found for submission, token: ${token.take(8)}...")
            return SubmitResult.NOT_FOUND
        }

        // Check if survey is expired
        if (invitation.expiresAt != null && LocalDateTime.now().isAfter(invitation.expiresAt)) {
            logger.warn("Survey expired for submission, token: ${token.take(8)}...")
            return SubmitResult.EXPIRED
        }

        // Check if already responded
        if (invitation.status == KtiInvitationStatus.RESPONDED || invitation.respondedAt != null) {
            logger.warn("Survey already responded, token: ${token.take(8)}...")
            return SubmitResult.ALREADY_COMPLETED
        }

        val assignment = invitation.assignment
        val round = assignment.round

        // Check if round is open for responses
        if (round.status != KtiRoundStatus.OPEN) {
            logger.warn("Survey round is not open (status: ${round.status}) for submission, token: ${token.take(8)}...")
            return SubmitResult.NOT_FOUND
        }

        // Get active questions for this round to validate responses
        val roundQuestions = roundQuestionRepository.findByRoundIdAndActiveOrderByDisplayOrder(round.id!!, true)
        val validQuestionIds = roundQuestions.map { it.question.id!! }.toSet()

        // Validate all responses
        for (response in responses) {
            if (response.questionId !in validQuestionIds) {
                logger.warn("Invalid question ID ${response.questionId} in submission, token: ${token.take(8)}...")
                return SubmitResult.INVALID_RESPONSE
            }
        }

        // Check required questions
        val requiredQuestionIds = roundQuestions
            .filter { it.question.required }
            .map { it.question.id!! }
            .toSet()

        val answeredQuestionIds = responses.map { it.questionId }.toSet()
        val missingRequired = requiredQuestionIds - answeredQuestionIds
        if (missingRequired.isNotEmpty()) {
            logger.warn("Missing required questions: $missingRequired, token: ${token.take(8)}...")
            return SubmitResult.MISSING_REQUIRED
        }

        // Save responses
        val questionMap = roundQuestions.associate { it.question.id!! to it.question }

        for (responseItem in responses) {
            val question = questionMap[responseItem.questionId]!!

            val ktiResponse = KtiResponse(
                invitation = invitation,
                question = question,
                ratingValue = responseItem.ratingValue,
                textValue = responseItem.textValue
            )
            responseRepository.save(ktiResponse)
        }

        // Update invitation status
        val updatedInvitation = invitation.copy(
            respondedAt = LocalDateTime.now(),
            status = KtiInvitationStatus.RESPONDED
        )
        invitationRepository.save(updatedInvitation)

        logger.info("Survey responses submitted successfully, token: ${token.take(8)}...")
        return SubmitResult.SUCCESS
    }

    enum class SubmitResult {
        SUCCESS,
        NOT_FOUND,
        EXPIRED,
        ALREADY_COMPLETED,
        INVALID_RESPONSE,
        MISSING_REQUIRED
    }
}
