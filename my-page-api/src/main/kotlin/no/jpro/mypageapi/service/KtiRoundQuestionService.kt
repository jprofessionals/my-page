package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.kti.KtiRoundQuestion
import no.jpro.mypageapi.repository.KtiQuestionRepository
import no.jpro.mypageapi.repository.KtiRoundQuestionRepository
import no.jpro.mypageapi.repository.KtiRoundRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class KtiRoundQuestionService(
    private val roundQuestionRepository: KtiRoundQuestionRepository,
    private val roundRepository: KtiRoundRepository,
    private val questionRepository: KtiQuestionRepository
) {

    fun getQuestionsForRound(roundId: Long, activeOnly: Boolean = false): List<KtiRoundQuestion> {
        return if (activeOnly) {
            roundQuestionRepository.findByRoundIdAndActiveOrderByDisplayOrder(roundId, true)
        } else {
            roundQuestionRepository.findByRoundIdOrderByDisplayOrder(roundId)
        }
    }

    @Transactional
    fun addQuestionToRound(roundId: Long, questionId: Long, displayOrder: Int, active: Boolean = true): KtiRoundQuestion {
        val round = roundRepository.findById(roundId).orElseThrow {
            IllegalArgumentException("Round not found: $roundId")
        }
        val question = questionRepository.findById(questionId).orElseThrow {
            IllegalArgumentException("Question not found: $questionId")
        }

        // Check if already exists
        if (roundQuestionRepository.existsByRoundIdAndQuestionId(roundId, questionId)) {
            throw IllegalArgumentException("Question $questionId is already added to round $roundId")
        }

        val roundQuestion = KtiRoundQuestion(
            round = round,
            question = question,
            displayOrder = displayOrder,
            active = active
        )
        return roundQuestionRepository.save(roundQuestion)
    }

    @Transactional
    fun updateRoundQuestion(roundId: Long, questionId: Long, displayOrder: Int?, active: Boolean?): KtiRoundQuestion? {
        val roundQuestion = roundQuestionRepository.findByRoundIdAndQuestionId(roundId, questionId)
            ?: return null

        displayOrder?.let { roundQuestion.displayOrder = it }
        active?.let { roundQuestion.active = it }

        return roundQuestionRepository.save(roundQuestion)
    }

    @Transactional
    fun removeQuestionFromRound(roundId: Long, questionId: Long): Boolean {
        val roundQuestion = roundQuestionRepository.findByRoundIdAndQuestionId(roundId, questionId)
            ?: return false
        roundQuestionRepository.delete(roundQuestion)
        return true
    }

    @Transactional
    fun copyQuestionsFromRound(targetRoundId: Long, sourceRoundId: Long): List<KtiRoundQuestion> {
        val targetRound = roundRepository.findById(targetRoundId).orElseThrow {
            IllegalArgumentException("Target round not found: $targetRoundId")
        }

        // Check if target already has questions
        val existingQuestions = roundQuestionRepository.findByRoundIdOrderByDisplayOrder(targetRoundId)
        if (existingQuestions.isNotEmpty()) {
            throw IllegalStateException("Target round already has ${existingQuestions.size} questions. Remove them first or use a different approach.")
        }

        val sourceQuestions = roundQuestionRepository.findByRoundIdOrderByDisplayOrder(sourceRoundId)
        if (sourceQuestions.isEmpty()) {
            throw IllegalArgumentException("Source round has no questions to copy")
        }

        return sourceQuestions.map { source ->
            val newRoundQuestion = KtiRoundQuestion(
                round = targetRound,
                question = source.question,
                displayOrder = source.displayOrder,
                active = source.active
            )
            roundQuestionRepository.save(newRoundQuestion)
        }
    }

    @Transactional
    fun initFromGlobalQuestions(roundId: Long): List<KtiRoundQuestion> {
        val round = roundRepository.findById(roundId).orElseThrow {
            IllegalArgumentException("Round not found: $roundId")
        }

        // Check if round already has questions
        val existingQuestions = roundQuestionRepository.findByRoundIdOrderByDisplayOrder(roundId)
        if (existingQuestions.isNotEmpty()) {
            throw IllegalStateException("Round already has ${existingQuestions.size} questions. Remove them first.")
        }

        // Get all active global questions
        val globalQuestions = questionRepository.findByActiveOrderByDisplayOrder(true)
        if (globalQuestions.isEmpty()) {
            throw IllegalArgumentException("No active global questions found")
        }

        return globalQuestions.map { question ->
            val roundQuestion = KtiRoundQuestion(
                round = round,
                question = question,
                displayOrder = question.displayOrder,
                active = true
            )
            roundQuestionRepository.save(roundQuestion)
        }
    }
}
