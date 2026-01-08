package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.ktu.*
import no.jpro.mypageapi.model.PublicSurveyData
import no.jpro.mypageapi.model.PublicSurveyQuestion
import no.jpro.mypageapi.model.SurveyAppearance
import no.jpro.mypageapi.model.SurveyResponseItem
import no.jpro.mypageapi.model.KtuQuestionType as ModelKtuQuestionType
import no.jpro.mypageapi.repository.KtuInvitationRepository
import no.jpro.mypageapi.repository.KtuResponseRepository
import no.jpro.mypageapi.repository.KtuRoundQuestionRepository
import no.jpro.mypageapi.repository.KtuQuestionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class KtuPublicSurveyService(
    private val invitationRepository: KtuInvitationRepository,
    private val responseRepository: KtuResponseRepository,
    private val roundQuestionRepository: KtuRoundQuestionRepository,
    private val questionRepository: KtuQuestionRepository
) {
    private val logger = LoggerFactory.getLogger(KtuPublicSurveyService::class.java)

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

        // Check if round is open for responses (also allow DRAFT for test surveys)
        if (round.status != KtuRoundStatus.OPEN && round.status != KtuRoundStatus.DRAFT) {
            logger.warn("Survey round is not open (status: ${round.status}) for token: ${token.take(8)}...")
            return null
        }

        // Get active questions for this round
        val roundQuestions = roundQuestionRepository.findByRoundIdAndActiveOrderByDisplayOrder(round.id!!, true)

        // Mark as opened if this is the first time
        if (invitation.openedAt == null) {
            val updated = invitation.copy(
                openedAt = LocalDateTime.now(),
                status = if (invitation.status == KtuInvitationStatus.PENDING || invitation.status == KtuInvitationStatus.SENT) {
                    KtuInvitationStatus.OPENED
                } else invitation.status
            )
            invitationRepository.save(updated)
            logger.info("Survey opened for token: ${token.take(8)}...")
        }

        val alreadyResponded = invitation.status == KtuInvitationStatus.RESPONDED ||
            invitation.respondedAt != null

        // Build appearance configuration with defaults
        val colorTheme = round.colorTheme
        val appearance = SurveyAppearance(
            logoUrl = round.logoUrl,
            headerBgColor = colorTheme?.headerBgColor ?: "#ffffff",
            primaryColor = colorTheme?.primaryColor ?: "#f97316",
            accentBgColor = colorTheme?.accentBgColor ?: "#fff7ed",
            introText = round.introText,
            instructionText = round.instructionText ?: "Vennligst vurder konsulentens arbeid på en skala fra 1 til 6, der 1 er svært misfornøyd og 6 er svært fornøyd. Spørsmål merket med * er obligatoriske.",
            ratingLabelLow = round.ratingLabelLow ?: "1 - Svært misfornøyd",
            ratingLabelHigh = round.ratingLabelHigh ?: "6 - Svært fornøyd",
            thankYouTitle = round.thankYouTitle ?: "Takk for din tilbakemelding!",
            thankYouMessage = round.thankYouMessage ?: "Din vurdering av ${consultant.name ?: "konsulenten"} fra ${organization?.name ?: "organisasjonen"} er nå registrert.",
            commentFieldLabel = round.commentFieldLabel ?: "Skriv din kommentar her..."
        )

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
                    // Use custom text for this round if set, otherwise fall back to global question text
                    text = rq.customTextNo ?: q.textNo,
                    questionType = ModelKtuQuestionType.valueOf(q.questionType.name),
                    category = q.category,
                    displayOrder = rq.displayOrder,
                    // Use requiredOverride if set, otherwise fall back to question.required
                    required = rq.requiredOverride ?: q.required,
                    // Per-question comment field label (for FREE_TEXT questions)
                    commentFieldLabel = rq.commentFieldLabel
                )
            },
            alreadyResponded = alreadyResponded,
            appearance = appearance
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
        if (invitation.status == KtuInvitationStatus.RESPONDED || invitation.respondedAt != null) {
            logger.warn("Survey already responded, token: ${token.take(8)}...")
            return SubmitResult.ALREADY_COMPLETED
        }

        val assignment = invitation.assignment
        val round = assignment.round

        // Check if round is open for responses (also allow DRAFT for test surveys)
        if (round.status != KtuRoundStatus.OPEN && round.status != KtuRoundStatus.DRAFT) {
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

        // Check required questions (use requiredOverride if set, otherwise question.required)
        val requiredQuestionIds = roundQuestions
            .filter { rq -> rq.requiredOverride ?: rq.question.required }
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

            val ktuResponse = KtuResponse(
                invitation = invitation,
                question = question,
                ratingValue = responseItem.ratingValue,
                textValue = responseItem.textValue
            )
            responseRepository.save(ktuResponse)
        }

        // Update invitation status
        val updatedInvitation = invitation.copy(
            respondedAt = LocalDateTime.now(),
            status = KtuInvitationStatus.RESPONDED
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
