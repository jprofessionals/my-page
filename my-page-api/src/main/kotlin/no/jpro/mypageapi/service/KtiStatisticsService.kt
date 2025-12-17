package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.kti.*
import no.jpro.mypageapi.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

data class RoundStatistics(
    val roundId: Long,
    val roundName: String,
    val totalInvitations: Int,
    val totalResponses: Int,
    val responseRate: Double,
    val averageScore: Double?,
    val consultantCount: Int,
    val organizationCount: Int,
    val scoreDistribution: Map<Int, Int>,
    val invitationsByStatus: Map<String, Int>,
    val questionStatistics: List<QuestionStatistics> = emptyList()
)

data class QuestionStatistics(
    val questionId: Long,
    val questionCode: String,
    val questionText: String,
    val averageScore: Double?,
    val responseCount: Int,
    val scoreDistribution: Map<Int, Int>
)

data class ResponseSummary(
    val id: Long,
    val consultantId: Long?,
    val consultantName: String,
    val organizationId: Long?,
    val organizationName: String,
    val contactId: Long?,
    val contactName: String,
    val contactEmail: String?,
    val averageScore: Double?,
    val respondedAt: java.time.LocalDateTime?,
    val questionResponses: List<QuestionResponseItem>
)

data class QuestionResponseItem(
    val id: Long,
    val questionId: Long,
    val questionCode: String,
    val questionText: String,
    val questionType: KtiQuestionType,
    val ratingValue: Int?,
    val textValue: String?
)

data class ConsultantStatistics(
    val consultantId: Long,
    val consultantName: String,
    val responseCount: Int,
    val averageScore: Double?,
    val organizationCount: Int,
    val scoreDistribution: Map<Int, Int>
)

// New data classes for historical/trend statistics
data class YearlyStatistics(
    val year: Int,
    val roundId: Long,
    val roundName: String,
    val totalResponses: Int,
    val responseRate: Double,
    val averageScore: Double?,
    val consultantCount: Int,
    val organizationCount: Int
)

data class QuestionTrend(
    val questionId: Long,
    val questionCode: String,
    val questionText: String,
    val yearlyAverages: Map<Int, Double?>  // year -> average score
)

data class CompanyTrendStatistics(
    val yearlyStatistics: List<YearlyStatistics>,
    val questionTrends: List<QuestionTrend>,
    val overallTrend: Map<Int, Double?>  // year -> overall average
)

data class ConsultantYearlyStats(
    val consultantId: Long,
    val consultantName: String,
    val email: String?,
    val yearlyData: Map<Int, ConsultantYearData>  // year -> data for that year
)

data class ConsultantYearData(
    val responseCount: Int,
    val averageScore: Double?,
    val organizationCount: Int
)

// Data classes for consultant's own statistics view
data class ConsultantOwnStatistics(
    val totalResponses: Int,
    val averageScore: Double?,
    val roundsParticipated: Int,
    val currentYearStats: ConsultantYearData?,
    val previousYearStats: ConsultantYearData?,
    val questionAverages: List<QuestionAverage>
)

data class QuestionAverage(
    val questionId: Long,
    val questionCode: String,
    val questionText: String,
    val category: String?,
    val averageScore: Double?,
    val responseCount: Int
)

@Service
class KtiStatisticsService(
    private val roundRepository: KtiRoundRepository,
    private val invitationRepository: KtiInvitationRepository,
    private val responseRepository: KtiResponseRepository,
    private val questionRepository: KtiQuestionRepository,
    private val roundQuestionRepository: KtiRoundQuestionRepository
) {
    @Transactional(readOnly = true)
    fun getRoundStatistics(roundId: Long): RoundStatistics? {
        val round = roundRepository.findById(roundId).orElse(null) ?: return null

        val invitations = invitationRepository.findByRoundId(roundId)
        val responses = responseRepository.findByRoundId(roundId)

        // Group responses by invitation to get unique responses
        val respondedInvitationIds = responses.mapNotNull { it.invitation?.id }.distinct()
        val totalResponses = respondedInvitationIds.size

        // Calculate response rate - only count invitations that have been sent (not PENDING)
        val sentInvitations = invitations.filter { it.status != KtiInvitationStatus.PENDING }
        val responseRate = if (sentInvitations.isNotEmpty()) {
            (totalResponses.toDouble() / sentInvitations.size) * 100
        } else 0.0

        // Calculate average score (only for rating questions)
        val ratingResponses = responses.filter { it.ratingValue != null }
        val averageScore = if (ratingResponses.isNotEmpty()) {
            ratingResponses.mapNotNull { it.ratingValue }.average()
        } else null

        // Count unique consultants and organizations
        val consultantIds = invitations.mapNotNull { it.assignment?.consultant?.id }.distinct()
        val respondedConsultantIds = responses.mapNotNull { it.invitation?.assignment?.consultant?.id }.distinct()
        val respondedOrganizationIds = responses.mapNotNull { it.invitation?.assignment?.contact?.organization?.id }.distinct()

        // Score distribution
        val scoreDistribution = ratingResponses
            .mapNotNull { it.ratingValue }
            .groupingBy { it }
            .eachCount()

        // Invitations by status
        val invitationsByStatus = invitations
            .groupingBy { it.status.name }
            .eachCount()

        // Per-question statistics
        val questionStats = ratingResponses
            .groupBy { it.question }
            .map { (question, qResponses) ->
                val ratings = qResponses.mapNotNull { it.ratingValue }
                QuestionStatistics(
                    questionId = question.id!!,
                    questionCode = question.code,
                    questionText = question.textNo,
                    averageScore = if (ratings.isNotEmpty()) ratings.average() else null,
                    responseCount = ratings.size,
                    scoreDistribution = ratings.groupingBy { it }.eachCount()
                )
            }
            .sortedBy { it.questionCode }

        return RoundStatistics(
            roundId = round.id!!,
            roundName = round.name,
            totalInvitations = sentInvitations.size,  // Only count sent invitations
            totalResponses = totalResponses,
            responseRate = responseRate,
            averageScore = averageScore,
            consultantCount = respondedConsultantIds.size,
            organizationCount = respondedOrganizationIds.size,
            scoreDistribution = scoreDistribution,
            invitationsByStatus = invitationsByStatus,
            questionStatistics = questionStats
        )
    }

    @Transactional(readOnly = true)
    fun getRoundResponses(roundId: Long): List<ResponseSummary> {
        val round = roundRepository.findById(roundId).orElse(null) ?: return emptyList()

        val responses = responseRepository.findByRoundId(roundId)

        // Group responses by invitation
        val responsesByInvitation = responses.groupBy { it.invitation.id }

        return responsesByInvitation.mapNotNull { (invitationId, invitationResponses) ->
            if (invitationId == null) return@mapNotNull null
            val invitation = invitationResponses.first().invitation
            val assignment = invitation.assignment
            val consultant = assignment.consultant
            val contact = assignment.contact
            val organization = contact?.organization

            // Calculate average score for this response
            val ratingValues = invitationResponses.mapNotNull { it.ratingValue }
            val avgScore = if (ratingValues.isNotEmpty()) ratingValues.average() else null

            // Map question responses
            val questionResponses = invitationResponses.map { response ->
                val question = response.question
                QuestionResponseItem(
                    id = response.id!!,
                    questionId = question.id!!,
                    questionCode = question.code,
                    questionText = question.textNo,
                    questionType = question.questionType,
                    ratingValue = response.ratingValue,
                    textValue = response.textValue
                )
            }

            ResponseSummary(
                id = invitationId,
                consultantId = consultant?.id,
                consultantName = consultant?.name ?: "Ukjent",
                organizationId = organization?.id,
                organizationName = organization?.name ?: "Ukjent",
                contactId = contact?.id,
                contactName = contact?.name ?: "Ukjent",
                contactEmail = contact?.email,
                averageScore = avgScore,
                respondedAt = invitation.respondedAt,
                questionResponses = questionResponses
            )
        }.sortedByDescending { it.respondedAt }
    }

    @Transactional(readOnly = true)
    fun getStatisticsByConsultant(roundId: Long): List<ConsultantStatistics> {
        val round = roundRepository.findById(roundId).orElse(null) ?: return emptyList()

        val responses = responseRepository.findByRoundId(roundId)

        // Group responses by consultant
        val responsesByConsultant = responses.groupBy { it.invitation?.assignment?.consultant?.id }

        return responsesByConsultant.mapNotNull { (consultantId, consultantResponses) ->
            if (consultantId == null) return@mapNotNull null

            val consultant = consultantResponses.firstOrNull()?.invitation?.assignment?.consultant
                ?: return@mapNotNull null

            // Group by invitation to get response count
            val invitationIds = consultantResponses.mapNotNull { it.invitation?.id }.distinct()

            // Calculate average score
            val ratingValues = consultantResponses.mapNotNull { it.ratingValue }
            val avgScore = if (ratingValues.isNotEmpty()) ratingValues.average() else null

            // Count unique organizations
            val organizationIds = consultantResponses
                .mapNotNull { it.invitation?.assignment?.contact?.organization?.id }
                .distinct()

            // Score distribution
            val scoreDistribution = ratingValues
                .groupingBy { it }
                .eachCount()

            ConsultantStatistics(
                consultantId = consultantId,
                consultantName = consultant.name ?: "Ukjent",
                responseCount = invitationIds.size,
                averageScore = avgScore,
                organizationCount = organizationIds.size,
                scoreDistribution = scoreDistribution
            )
        }.sortedByDescending { it.responseCount }
    }

    @Transactional(readOnly = true)
    fun getCompanyTrendStatistics(): CompanyTrendStatistics {
        val allRounds = roundRepository.findAll().sortedBy { it.year }
        val allQuestions = questionRepository.findByActive(true)

        val yearlyStatsList = mutableListOf<YearlyStatistics>()
        val overallTrend = mutableMapOf<Int, Double?>()
        val questionYearlyAverages = mutableMapOf<Long, MutableMap<Int, Double?>>()

        // Initialize question maps
        allQuestions.filter { it.questionType == KtiQuestionType.RATING_1_6 }.forEach { q ->
            questionYearlyAverages[q.id!!] = mutableMapOf()
        }

        for (round in allRounds) {
            val roundId = round.id ?: continue
            val year = round.year

            val invitations = invitationRepository.findByRoundId(roundId)
            val responses = responseRepository.findByRoundId(roundId)

            // Calculate basic stats - only count sent invitations (not PENDING)
            val sentInvitations = invitations.filter { it.status != KtiInvitationStatus.PENDING }
            val respondedInvitationIds = responses.mapNotNull { it.invitation?.id }.distinct()
            val totalResponses = respondedInvitationIds.size
            val responseRate = if (sentInvitations.isNotEmpty()) {
                (totalResponses.toDouble() / sentInvitations.size) * 100
            } else 0.0

            // Overall average
            val ratingResponses = responses.filter { it.ratingValue != null }
            val averageScore = if (ratingResponses.isNotEmpty()) {
                ratingResponses.mapNotNull { it.ratingValue }.average()
            } else null

            overallTrend[year] = averageScore

            // Per-question averages
            val responsesByQuestion = ratingResponses.groupBy { it.question.id }
            for ((questionId, qResponses) in responsesByQuestion) {
                if (questionId != null && questionYearlyAverages.containsKey(questionId)) {
                    val qAvg = qResponses.mapNotNull { it.ratingValue }.average()
                    questionYearlyAverages[questionId]!![year] = qAvg
                }
            }

            // Count consultants and organizations
            val consultantCount = responses.mapNotNull { it.invitation?.assignment?.consultant?.id }.distinct().size
            val organizationCount = responses.mapNotNull { it.invitation?.assignment?.contact?.organization?.id }.distinct().size

            yearlyStatsList.add(YearlyStatistics(
                year = year,
                roundId = roundId,
                roundName = round.name,
                totalResponses = totalResponses,
                responseRate = responseRate,
                averageScore = averageScore,
                consultantCount = consultantCount,
                organizationCount = organizationCount
            ))
        }

        // Build question trends
        val questionTrends = allQuestions.filter { it.questionType == KtiQuestionType.RATING_1_6 }.map { question ->
            QuestionTrend(
                questionId = question.id!!,
                questionCode = question.code,
                questionText = question.textNo,
                yearlyAverages = questionYearlyAverages[question.id] ?: emptyMap()
            )
        }

        return CompanyTrendStatistics(
            yearlyStatistics = yearlyStatsList,
            questionTrends = questionTrends,
            overallTrend = overallTrend
        )
    }

    @Transactional(readOnly = true)
    fun getConsultantsTrendStatistics(): List<ConsultantYearlyStats> {
        val allRounds = roundRepository.findAll()
        val consultantDataMap = mutableMapOf<Long, MutableMap<Int, ConsultantYearData>>()
        val consultantInfoMap = mutableMapOf<Long, Pair<String, String?>>()  // id -> (name, email)

        for (round in allRounds) {
            val roundId = round.id ?: continue
            val year = round.year

            val responses = responseRepository.findByRoundId(roundId)
            val responsesByConsultant = responses.groupBy { it.invitation?.assignment?.consultant?.id }

            for ((consultantId, consultantResponses) in responsesByConsultant) {
                if (consultantId == null) continue

                val consultant = consultantResponses.firstOrNull()?.invitation?.assignment?.consultant ?: continue

                // Store consultant info
                if (!consultantInfoMap.containsKey(consultantId)) {
                    consultantInfoMap[consultantId] = Pair(consultant.name ?: "Ukjent", consultant.email)
                }

                // Calculate stats for this year
                val invitationIds = consultantResponses.mapNotNull { it.invitation?.id }.distinct()
                val ratingValues = consultantResponses.mapNotNull { it.ratingValue }
                val avgScore = if (ratingValues.isNotEmpty()) ratingValues.average() else null
                val orgCount = consultantResponses.mapNotNull { it.invitation?.assignment?.contact?.organization?.id }.distinct().size

                // Add to map
                if (!consultantDataMap.containsKey(consultantId)) {
                    consultantDataMap[consultantId] = mutableMapOf()
                }
                consultantDataMap[consultantId]!![year] = ConsultantYearData(
                    responseCount = invitationIds.size,
                    averageScore = avgScore,
                    organizationCount = orgCount
                )
            }
        }

        return consultantDataMap.map { (consultantId, yearlyData) ->
            val (name, email) = consultantInfoMap[consultantId] ?: Pair("Ukjent", null)
            ConsultantYearlyStats(
                consultantId = consultantId,
                consultantName = name,
                email = email,
                yearlyData = yearlyData
            )
        }.sortedBy { it.consultantName }
    }

    // === Consultant's own statistics methods ===

    @Transactional(readOnly = true)
    fun getConsultantOwnStatistics(consultantId: Long): ConsultantOwnStatistics? {
        val allResponses = responseRepository.findByConsultantId(consultantId)
        if (allResponses.isEmpty()) return null

        val currentYear = java.time.Year.now().value
        val previousYear = currentYear - 1

        // Calculate total unique responses (by invitation)
        val invitationIds = allResponses.mapNotNull { it.invitation?.id }.distinct()
        val totalResponses = invitationIds.size

        // Calculate overall average score
        val ratingValues = allResponses.mapNotNull { it.ratingValue }
        val averageScore = if (ratingValues.isNotEmpty()) ratingValues.average() else null

        // Count rounds participated
        val roundIds = allResponses.mapNotNull { it.invitation?.assignment?.round?.id }.distinct()
        val roundsParticipated = roundIds.size

        // Calculate current year and previous year stats
        val currentYearResponses = allResponses.filter {
            it.invitation?.assignment?.round?.year == currentYear
        }
        val previousYearResponses = allResponses.filter {
            it.invitation?.assignment?.round?.year == previousYear
        }

        val currentYearStats = calculateYearData(currentYearResponses)
        val previousYearStats = calculateYearData(previousYearResponses)

        // Per-question averages (across all years)
        val questionAverages = allResponses
            .filter { it.ratingValue != null }
            .groupBy { it.question }
            .map { (question, qResponses) ->
                val ratings = qResponses.mapNotNull { it.ratingValue }
                QuestionAverage(
                    questionId = question.id!!,
                    questionCode = question.code,
                    questionText = question.textNo,
                    category = question.category,
                    averageScore = if (ratings.isNotEmpty()) ratings.average() else null,
                    responseCount = ratings.size
                )
            }
            .sortedBy { it.questionCode }

        return ConsultantOwnStatistics(
            totalResponses = totalResponses,
            averageScore = averageScore,
            roundsParticipated = roundsParticipated,
            currentYearStats = currentYearStats,
            previousYearStats = previousYearStats,
            questionAverages = questionAverages
        )
    }

    private fun calculateYearData(responses: List<KtiResponse>): ConsultantYearData? {
        if (responses.isEmpty()) return null

        val invitationIds = responses.mapNotNull { it.invitation?.id }.distinct()
        val ratingValues = responses.mapNotNull { it.ratingValue }
        val avgScore = if (ratingValues.isNotEmpty()) ratingValues.average() else null
        val orgCount = responses.mapNotNull { it.invitation?.assignment?.contact?.organization?.id }.distinct().size

        return ConsultantYearData(
            responseCount = invitationIds.size,
            averageScore = avgScore,
            organizationCount = orgCount
        )
    }

    @Transactional(readOnly = true)
    fun getConsultantOwnTrend(consultantId: Long): ConsultantYearlyStats? {
        val allStats = getConsultantsTrendStatistics()
        return allStats.find { it.consultantId == consultantId }
    }

    @Transactional(readOnly = true)
    fun getConsultantOwnResponses(consultantId: Long, roundId: Long? = null): List<ResponseSummary> {
        val responses = if (roundId != null) {
            responseRepository.findByRoundIdAndConsultantId(roundId, consultantId)
        } else {
            responseRepository.findByConsultantId(consultantId)
        }

        // Group responses by invitation
        val responsesByInvitation = responses.groupBy { it.invitation.id }

        return responsesByInvitation.mapNotNull { (invitationId, invitationResponses) ->
            if (invitationId == null) return@mapNotNull null
            val invitation = invitationResponses.first().invitation
            val assignment = invitation.assignment
            val consultant = assignment.consultant
            val contact = assignment.contact
            val organization = contact?.organization
            val round = assignment.round

            // Get all questions for this round (ordered by display order)
            val roundQuestions = roundQuestionRepository.findByRoundIdAndActiveOrderByDisplayOrder(round.id!!, true)

            // Create a map of answered questions (questionId -> response)
            val answeredQuestionMap = invitationResponses.associateBy { it.question.id }

            // Build question responses: include ALL questions from the round, not just answered ones
            val questionResponses = roundQuestions.mapIndexed { index, roundQuestion ->
                val question = roundQuestion.question
                val existingResponse = answeredQuestionMap[question.id]

                if (existingResponse != null) {
                    // Question was answered
                    QuestionResponseItem(
                        id = existingResponse.id!!,
                        questionId = question.id!!,
                        questionCode = question.code,
                        questionText = question.textNo,
                        questionType = question.questionType,
                        ratingValue = existingResponse.ratingValue,
                        textValue = existingResponse.textValue
                    )
                } else {
                    // Question was NOT answered - create placeholder with null values
                    QuestionResponseItem(
                        id = -1L - index,  // Negative ID to indicate this is a placeholder
                        questionId = question.id!!,
                        questionCode = question.code,
                        questionText = question.textNo,
                        questionType = question.questionType,
                        ratingValue = null,
                        textValue = null
                    )
                }
            }

            // Calculate average score for this response (only from answered rating questions)
            val ratingValues = invitationResponses.mapNotNull { it.ratingValue }
            val avgScore = if (ratingValues.isNotEmpty()) ratingValues.average() else null

            ResponseSummary(
                id = invitationId,
                consultantId = consultant?.id,
                consultantName = consultant?.name ?: "Ukjent",
                organizationId = organization?.id,
                organizationName = organization?.name ?: "Ukjent",
                contactId = contact?.id,
                contactName = contact?.name ?: "Ukjent",
                contactEmail = contact?.email,
                averageScore = avgScore,
                respondedAt = invitation.respondedAt,
                questionResponses = questionResponses
            )
        }.sortedByDescending { it.respondedAt }
    }
}
