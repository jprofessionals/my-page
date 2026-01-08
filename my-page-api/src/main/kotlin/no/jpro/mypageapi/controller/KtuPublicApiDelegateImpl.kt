package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.KtuPublicApiDelegate
import no.jpro.mypageapi.model.KtuCompanyTrendStatistics
import no.jpro.mypageapi.model.KtuQuestionTrend
import no.jpro.mypageapi.model.KtuYearlyStatistics
import no.jpro.mypageapi.model.PublicSurveyData
import no.jpro.mypageapi.model.SubmitSurveyResponses
import no.jpro.mypageapi.service.KtuPublicSurveyService
import no.jpro.mypageapi.service.KtuPublicSurveyService.SubmitResult
import no.jpro.mypageapi.service.KtuStatisticsService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service

@Service
class KtuPublicApiDelegateImpl(
    private val publicSurveyService: KtuPublicSurveyService,
    private val statisticsService: KtuStatisticsService
) : KtuPublicApiDelegate {

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

    override fun getPublicCompanyTrends(): ResponseEntity<KtuCompanyTrendStatistics> {
        val trends = statisticsService.getCompanyTrendStatistics()
        return ResponseEntity.ok(KtuCompanyTrendStatistics(
            yearlyStatistics = trends.yearlyStatistics.map { ys ->
                KtuYearlyStatistics(
                    year = ys.year,
                    roundId = ys.roundId,
                    roundName = ys.roundName,
                    totalResponses = ys.totalResponses,
                    responseRate = ys.responseRate,
                    averageScore = ys.averageScore,
                    consultantCount = ys.consultantCount,
                    organizationCount = ys.organizationCount
                )
            },
            questionTrends = trends.questionTrends.map { qt ->
                KtuQuestionTrend(
                    questionId = qt.questionId,
                    questionCode = qt.questionCode,
                    questionText = qt.questionText,
                    yearlyAverages = qt.yearlyAverages
                        .filterValues { it != null }
                        .mapKeys { it.key.toString() }
                        .mapValues { it.value!! },
                    yearlyResponseCounts = qt.yearlyResponseCounts
                        .mapKeys { it.key.toString() }
                )
            },
            overallTrend = trends.overallTrend
                .filterValues { it != null }
                .mapKeys { it.key.toString() }
                .mapValues { it.value!! }
        ))
    }
}
