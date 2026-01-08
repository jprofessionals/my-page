package no.jpro.mypageapi.integration.ktu

import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.entity.ktu.*
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.model.PublicSurveyData
import no.jpro.mypageapi.model.SubmitSurveyResponses
import no.jpro.mypageapi.model.SurveyResponseItem
import no.jpro.mypageapi.repository.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.time.LocalDateTime

class KtuPublicSurveyTest(
    @Autowired private val roundRepository: KtuRoundRepository,
    @Autowired private val organizationRepository: KtuOrganizationRepository,
    @Autowired private val contactRepository: KtuContactRepository,
    @Autowired private val questionRepository: KtuQuestionRepository,
    @Autowired private val roundQuestionRepository: KtuRoundQuestionRepository,
    @Autowired private val assignmentRepository: KtuAssignmentRepository,
    @Autowired private val invitationRepository: KtuInvitationRepository,
    @Autowired private val responseRepository: KtuResponseRepository,
    @Autowired private val userRepository: UserRepository,
) : IntegrationTestBase() {

    private lateinit var testConsultant: User
    private lateinit var testOrganization: KtuCustomerOrganization
    private lateinit var testContact: KtuCustomerContact
    private lateinit var testRound: KtuRound
    private lateinit var testQuestion: KtuQuestion

    @BeforeEach
    fun setup() {
        responseRepository.deleteAll()
        invitationRepository.deleteAll()
        assignmentRepository.deleteAll()
        roundQuestionRepository.deleteAll()
        questionRepository.deleteAll()
        contactRepository.deleteAll()
        organizationRepository.deleteAll()
        roundRepository.deleteAll()

        // Create test data
        testConsultant = userRepository.save(
            User(
                email = "consultant@test.no",
                name = "Test Konsulent",
                givenName = "Test",
                familyName = "Konsulent",
                sub = "test-consultant-sub-${System.currentTimeMillis()}",
                budgets = emptyList()
            )
        )

        testOrganization = organizationRepository.save(
            KtuCustomerOrganization(
                name = "Test Kunde AS",
                organizationNumber = "123456789"
            )
        )

        testContact = contactRepository.save(
            KtuCustomerContact(
                name = "Kari Kontakt",
                email = "kari@testkunde.no",
                organization = testOrganization
            )
        )

        testRound = roundRepository.save(
            KtuRound(
                name = "KTU Test 2025",
                year = 2025,
                status = KtuRoundStatus.OPEN
            )
        )

        testQuestion = questionRepository.save(
            KtuQuestion(
                code = "Q1",
                textNo = "Hvor fornøyd er du med konsulentens arbeid?",
                textEn = null,
                questionType = KtuQuestionType.RATING_1_6,
                category = "Generelt",
                displayOrder = 1,
                active = true,
                required = true
            )
        )

        // Add question to round
        roundQuestionRepository.save(
            KtuRoundQuestion(
                round = testRound,
                question = testQuestion,
                displayOrder = 1,
                active = true
            )
        )
    }

    private fun createInvitation(
        status: KtuInvitationStatus = KtuInvitationStatus.SENT,
        expiresAt: LocalDateTime? = LocalDateTime.now().plusDays(7)
    ): KtuInvitation {
        val assignment = assignmentRepository.save(
            KtuAssignment(
                round = testRound,
                consultant = testConsultant,
                contact = testContact
            )
        )

        return invitationRepository.save(
            KtuInvitation(
                assignment = assignment,
                token = "test-token-${System.currentTimeMillis()}",
                status = status,
                expiresAt = expiresAt
            )
        )
    }

    @Nested
    inner class GetPublicSurvey {
        @Test
        fun `should get survey by valid token`() {
            // Arrange
            val invitation = createInvitation()

            // Act
            val response = restClient(false)
                .getForEntity<PublicSurveyData>("/ktu/public/survey/${invitation.token}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val surveyData = response.body!!
            assertThat(surveyData.consultantName).isEqualTo("Test Konsulent")
            assertThat(surveyData.organizationName).isEqualTo("Test Kunde AS")
            assertThat(surveyData.questions).hasSize(1)
            assertThat(surveyData.alreadyResponded).isFalse()
        }

        @Test
        fun `should return 404 for invalid token`() {
            // Act
            val response = restClient(false)
                .getForEntity<String>("/ktu/public/survey/invalid-token")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        }

        @Test
        fun `should return 404 for expired survey`() {
            // Arrange
            val invitation = createInvitation(expiresAt = LocalDateTime.now().minusDays(1))

            // Act
            val response = restClient(false)
                .getForEntity<String>("/ktu/public/survey/${invitation.token}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        }

        @Test
        fun `should allow survey access when round is DRAFT for testing`() {
            // Arrange - Set round to DRAFT
            val draftRound = roundRepository.save(testRound.copy(status = KtuRoundStatus.DRAFT))
            testRound = draftRound

            val invitation = createInvitation()

            // Act
            val response = restClient(false)
                .getForEntity<PublicSurveyData>("/ktu/public/survey/${invitation.token}")

            // Assert - Should work for DRAFT rounds (allows testing)
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        }

        @Test
        fun `should return 404 when round is CLOSED`() {
            // Arrange - Set round to CLOSED
            val closedRound = roundRepository.save(testRound.copy(status = KtuRoundStatus.CLOSED))
            testRound = closedRound

            val invitation = createInvitation()

            // Act
            val response = restClient(false)
                .getForEntity<String>("/ktu/public/survey/${invitation.token}")

            // Assert - Should fail for CLOSED rounds
            assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        }

        @Test
        fun `should return GONE status for already responded survey`() {
            // Arrange
            val invitation = createInvitation(status = KtuInvitationStatus.RESPONDED)
            invitationRepository.save(invitation.copy(respondedAt = LocalDateTime.now()))

            // Act
            val response = restClient(false)
                .getForEntity<PublicSurveyData>("/ktu/public/survey/${invitation.token}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.GONE)
            val surveyData = response.body!!
            assertThat(surveyData.alreadyResponded).isTrue()
        }
    }

    @Nested
    inner class SubmitSurveyResponses {
        @Test
        fun `should submit survey responses successfully`() {
            // Arrange
            val invitation = createInvitation()

            val submitRequest = SubmitSurveyResponses(
                responses = listOf(
                    SurveyResponseItem(
                        questionId = testQuestion.id!!,
                        ratingValue = 5
                    )
                )
            )

            // Act
            val response = restClient(false)
                .postForEntity<String>(
                    "/ktu/public/survey/${invitation.token}/responses",
                    submitRequest
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)

            // Verify response was saved
            val savedResponses = responseRepository.findByInvitationId(invitation.id!!)
            assertThat(savedResponses).hasSize(1)
            assertThat(savedResponses.first().ratingValue).isEqualTo(5)

            // Verify invitation was marked as responded
            val updatedInvitation = invitationRepository.findByToken(invitation.token!!)
            assertThat(updatedInvitation?.status).isEqualTo(KtuInvitationStatus.RESPONDED)
            assertThat(updatedInvitation?.respondedAt).isNotNull()
        }

        @Test
        fun `should reject submission with missing required question`() {
            // Arrange
            val invitation = createInvitation()

            // Submit without answering the required question
            val submitRequest = SubmitSurveyResponses(
                responses = emptyList()
            )

            // Act
            val response = restClient(false)
                .postForEntity<String>(
                    "/ktu/public/survey/${invitation.token}/responses",
                    submitRequest
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        }

        @Test
        fun `should reject duplicate submission`() {
            // Arrange
            val invitation = createInvitation(status = KtuInvitationStatus.RESPONDED)
            invitationRepository.save(invitation.copy(respondedAt = LocalDateTime.now()))

            val submitRequest = SubmitSurveyResponses(
                responses = listOf(
                    SurveyResponseItem(
                        questionId = testQuestion.id!!,
                        ratingValue = 5
                    )
                )
            )

            // Act
            val response = restClient(false)
                .postForEntity<String>(
                    "/ktu/public/survey/${invitation.token}/responses",
                    submitRequest
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.CONFLICT)
        }

        @Test
        fun `should reject submission with invalid question id`() {
            // Arrange
            val invitation = createInvitation()

            val submitRequest = SubmitSurveyResponses(
                responses = listOf(
                    SurveyResponseItem(
                        questionId = 99999L,  // Non-existent question
                        ratingValue = 5
                    )
                )
            )

            // Act
            val response = restClient(false)
                .postForEntity<String>(
                    "/ktu/public/survey/${invitation.token}/responses",
                    submitRequest
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        }
    }

    @Nested
    inner class SurveyAppearance {
        @Test
        fun `should include custom appearance settings in survey data`() {
            // Arrange - Create round with custom appearance
            val customRound = roundRepository.save(
                testRound.copy(
                    introText = "Velkommen til vår undersøkelse!",
                    thankYouTitle = "Tusen takk!",
                    thankYouMessage = "Vi setter pris på din tilbakemelding.",
                    ratingLabelLow = "Svært dårlig",
                    ratingLabelHigh = "Utmerket"
                )
            )
            testRound = customRound

            val invitation = createInvitation()

            // Act
            val response = restClient(false)
                .getForEntity<PublicSurveyData>("/ktu/public/survey/${invitation.token}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val surveyData = response.body!!
            assertThat(surveyData.appearance.introText).isEqualTo("Velkommen til vår undersøkelse!")
            assertThat(surveyData.appearance.thankYouTitle).isEqualTo("Tusen takk!")
            assertThat(surveyData.appearance.thankYouMessage).isEqualTo("Vi setter pris på din tilbakemelding.")
            assertThat(surveyData.appearance.ratingLabelLow).isEqualTo("Svært dårlig")
            assertThat(surveyData.appearance.ratingLabelHigh).isEqualTo("Utmerket")
        }
    }
}
