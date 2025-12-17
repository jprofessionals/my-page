package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.KtiPublicApiDelegate
import no.jpro.mypageapi.model.PublicSurveyData
import no.jpro.mypageapi.model.SubmitSurveyResponses
import no.jpro.mypageapi.service.KtiPublicSurveyService
import no.jpro.mypageapi.service.KtiPublicSurveyService.SubmitResult
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service

@Service
class KtiPublicApiDelegateImpl(
    private val publicSurveyService: KtiPublicSurveyService
) : KtiPublicApiDelegate {

    override fun getPublicSurvey(token: String): ResponseEntity<PublicSurveyData> {
        val surveyData = publicSurveyService.getSurveyByToken(token)
            ?: return ResponseEntity.notFound().build()

        if (surveyData.alreadyResponded) {
            return ResponseEntity.status(HttpStatus.GONE).body(surveyData)
        }

        return ResponseEntity.ok(surveyData)
    }

    override fun submitPublicSurveyResponses(
        token: String,
        submitSurveyResponses: SubmitSurveyResponses
    ): ResponseEntity<Unit> {
        return when (publicSurveyService.submitResponses(token, submitSurveyResponses.responses)) {
            SubmitResult.SUCCESS -> ResponseEntity.status(HttpStatus.CREATED).build()
            SubmitResult.NOT_FOUND -> ResponseEntity.notFound().build()
            SubmitResult.EXPIRED -> ResponseEntity.notFound().build()
            SubmitResult.ALREADY_COMPLETED -> ResponseEntity.status(HttpStatus.CONFLICT).build()
            SubmitResult.INVALID_RESPONSE -> ResponseEntity.badRequest().build()
            SubmitResult.MISSING_REQUIRED -> ResponseEntity.badRequest().build()
        }
    }
}
