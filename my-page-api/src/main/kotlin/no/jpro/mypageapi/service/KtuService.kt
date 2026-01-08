package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.entity.ktu.*
import no.jpro.mypageapi.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class KtuRoundService(
    private val roundRepository: KtuRoundRepository,
    private val colorThemeRepository: KtuColorThemeRepository
) {
    @Transactional(readOnly = true)
    fun getAllRounds(): List<KtuRound> = roundRepository.findAll()

    @Transactional(readOnly = true)
    fun getRoundsByStatus(status: KtuRoundStatus): List<KtuRound> = roundRepository.findByStatus(status)

    @Transactional(readOnly = true)
    fun getRound(id: Long): KtuRound? = roundRepository.findById(id).orElse(null)

    @Transactional
    fun createRound(name: String, year: Int, openDate: LocalDate?, closeDate: LocalDate?, createdBy: User?): KtuRound {
        val round = KtuRound(
            name = name,
            year = year,
            status = KtuRoundStatus.DRAFT,
            openDate = openDate,
            closeDate = closeDate,
            createdBy = createdBy
        )
        return roundRepository.save(round)
    }

    @Transactional
    fun updateRound(
        id: Long,
        name: String?,
        openDate: LocalDate?,
        closeDate: LocalDate?,
        status: KtuRoundStatus?,
        // Appearance fields
        logoUrl: String? = null,
        colorThemeId: Long? = null,
        introText: String? = null,
        instructionText: String? = null,
        ratingLabelLow: String? = null,
        ratingLabelHigh: String? = null,
        thankYouTitle: String? = null,
        thankYouMessage: String? = null,
        commentFieldLabel: String? = null,
        clearLogoUrl: Boolean = false,
        clearColorTheme: Boolean = false,
        // Import statistics
        manualSentCount: Int? = null,
        clearManualSentCount: Boolean = false
    ): KtuRound? {
        val existing = roundRepository.findById(id).orElse(null) ?: return null

        // Resolve color theme if provided
        val colorTheme = when {
            clearColorTheme -> null
            colorThemeId != null -> colorThemeRepository.findById(colorThemeId).orElse(null)
                ?: throw IllegalArgumentException("Fargetema med id $colorThemeId finnes ikke")
            else -> existing.colorTheme
        }

        val updated = existing.copy(
            name = name ?: existing.name,
            openDate = openDate ?: existing.openDate,
            closeDate = closeDate ?: existing.closeDate,
            status = status ?: existing.status,
            updatedAt = LocalDateTime.now(),
            // Appearance fields
            logoUrl = if (clearLogoUrl) null else (logoUrl ?: existing.logoUrl),
            colorTheme = colorTheme,
            introText = introText ?: existing.introText,
            instructionText = instructionText ?: existing.instructionText,
            ratingLabelLow = ratingLabelLow ?: existing.ratingLabelLow,
            ratingLabelHigh = ratingLabelHigh ?: existing.ratingLabelHigh,
            thankYouTitle = thankYouTitle ?: existing.thankYouTitle,
            thankYouMessage = thankYouMessage ?: existing.thankYouMessage,
            commentFieldLabel = commentFieldLabel ?: existing.commentFieldLabel,
            // Import statistics
            manualSentCount = if (clearManualSentCount) null else (manualSentCount ?: existing.manualSentCount)
        )
        return roundRepository.save(updated)
    }

    @Transactional
    fun deleteRound(id: Long): Boolean {
        val round = roundRepository.findById(id).orElse(null) ?: return false
        roundRepository.delete(round)
        return true
    }
}

@Service
class KtuOrganizationService(
    private val organizationRepository: KtuOrganizationRepository
) {
    @Transactional(readOnly = true)
    fun getAllOrganizations(): List<KtuCustomerOrganization> = organizationRepository.findAll()

    @Transactional(readOnly = true)
    fun getActiveOrganizations(): List<KtuCustomerOrganization> = organizationRepository.findByActive(true)

    @Transactional(readOnly = true)
    fun getOrganization(id: Long): KtuCustomerOrganization? = organizationRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun getOrganizationByName(name: String): KtuCustomerOrganization? = organizationRepository.findByNameIgnoreCase(name)

    @Transactional
    fun createOrganization(name: String, organizationNumber: String?): KtuCustomerOrganization {
        if (organizationRepository.existsByNameIgnoreCase(name)) {
            throw IllegalArgumentException("Organisasjon med navn '$name' eksisterer allerede")
        }
        val organization = KtuCustomerOrganization(
            name = name,
            organizationNumber = organizationNumber
        )
        return organizationRepository.save(organization)
    }

    @Transactional
    fun updateOrganization(
        id: Long,
        name: String?,
        organizationNumber: String?,
        active: Boolean?
    ): KtuCustomerOrganization? {
        val existing = organizationRepository.findById(id).orElse(null) ?: return null

        // Check if new name conflicts with existing org
        if (name != null && name != existing.name && organizationRepository.existsByNameIgnoreCase(name)) {
            throw IllegalArgumentException("Organisasjon med navn '$name' eksisterer allerede")
        }

        val updated = existing.copy(
            name = name ?: existing.name,
            organizationNumber = organizationNumber ?: existing.organizationNumber,
            active = active ?: existing.active,
            updatedAt = LocalDateTime.now()
        )
        return organizationRepository.save(updated)
    }

    @Transactional
    fun getOrCreateOrganization(name: String): KtuCustomerOrganization {
        return organizationRepository.findByNameIgnoreCase(name)
            ?: createOrganization(name, null)
    }
}

@Service
class KtuContactService(
    private val contactRepository: KtuContactRepository,
    private val organizationRepository: KtuOrganizationRepository
) {
    @Transactional(readOnly = true)
    fun getAllContacts(): List<KtuCustomerContact> = contactRepository.findAll()

    @Transactional(readOnly = true)
    fun getActiveContacts(): List<KtuCustomerContact> = contactRepository.findByActive(true)

    @Transactional(readOnly = true)
    fun getContactsByOrganization(organizationId: Long, activeOnly: Boolean): List<KtuCustomerContact> {
        return if (activeOnly) {
            contactRepository.findByOrganizationIdAndActive(organizationId, true)
        } else {
            contactRepository.findByOrganizationId(organizationId)
        }
    }

    @Transactional(readOnly = true)
    fun getContact(id: Long): KtuCustomerContact? = contactRepository.findById(id).orElse(null)

    @Transactional
    fun createContact(
        name: String,
        email: String?,
        phone: String?,
        title: String?,
        organizationId: Long
    ): KtuCustomerContact {
        val organization = organizationRepository.findById(organizationId).orElse(null)
            ?: throw IllegalArgumentException("Organisasjon med id $organizationId finnes ikke")

        val contact = KtuCustomerContact(
            name = name,
            email = email,
            phone = phone,
            title = title,
            organization = organization
        )
        return contactRepository.save(contact)
    }

    @Transactional
    fun updateContact(
        id: Long,
        name: String?,
        email: String?,
        phone: String?,
        title: String?,
        organizationId: Long?,
        active: Boolean?,
        optedOut: Boolean?
    ): KtuCustomerContact? {
        val existing = contactRepository.findById(id).orElse(null) ?: return null

        val organization = if (organizationId != null && organizationId != existing.organization.id) {
            organizationRepository.findById(organizationId).orElse(null)
                ?: throw IllegalArgumentException("Organisasjon med id $organizationId finnes ikke")
        } else {
            existing.organization
        }

        val optedOutAt = when {
            optedOut == true && !existing.optedOut -> LocalDateTime.now()
            optedOut == false -> null
            else -> existing.optedOutAt
        }

        val updated = existing.copy(
            name = name ?: existing.name,
            email = email ?: existing.email,
            phone = phone ?: existing.phone,
            title = title ?: existing.title,
            organization = organization,
            active = active ?: existing.active,
            optedOut = optedOut ?: existing.optedOut,
            optedOutAt = optedOutAt,
            updatedAt = LocalDateTime.now()
        )
        return contactRepository.save(updated)
    }
}

@Service
class KtuQuestionService(
    private val questionRepository: KtuQuestionRepository
) {
    @Transactional(readOnly = true)
    fun getAllQuestions(): List<KtuQuestion> = questionRepository.findAllByOrderByDisplayOrder()

    @Transactional(readOnly = true)
    fun getActiveQuestions(): List<KtuQuestion> = questionRepository.findByActiveOrderByDisplayOrder(true)

    @Transactional(readOnly = true)
    fun getQuestion(id: Long): KtuQuestion? = questionRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun getQuestionByCode(code: String): KtuQuestion? = questionRepository.findByCode(code)

    @Transactional
    fun createQuestion(
        code: String,
        textNo: String,
        textEn: String?,
        questionType: KtuQuestionType,
        category: String,
        displayOrder: Int,
        required: Boolean = true
    ): KtuQuestion {
        if (questionRepository.findByCode(code) != null) {
            throw IllegalArgumentException("Sporsmal med kode '$code' eksisterer allerede")
        }
        val question = KtuQuestion(
            code = code,
            textNo = textNo,
            textEn = textEn,
            questionType = questionType,
            category = category,
            displayOrder = displayOrder,
            active = true,
            required = required
        )
        return questionRepository.save(question)
    }

    @Transactional
    fun updateQuestion(
        id: Long,
        code: String?,
        textNo: String?,
        textEn: String?,
        questionType: KtuQuestionType?,
        category: String?,
        displayOrder: Int?,
        active: Boolean?,
        required: Boolean?
    ): KtuQuestion? {
        val existing = questionRepository.findById(id).orElse(null) ?: return null

        // Check if code is being changed and if new code already exists
        if (code != null && code != existing.code && questionRepository.findByCode(code) != null) {
            throw IllegalArgumentException("Sporsmal med kode '$code' eksisterer allerede")
        }

        val updated = existing.copy(
            code = code ?: existing.code,
            textNo = textNo ?: existing.textNo,
            textEn = textEn ?: existing.textEn,
            questionType = questionType ?: existing.questionType,
            category = category ?: existing.category,
            displayOrder = displayOrder ?: existing.displayOrder,
            active = active ?: existing.active,
            required = required ?: existing.required
        )
        return questionRepository.save(updated)
    }
}

@Service
class KtuAssignmentService(
    private val assignmentRepository: KtuAssignmentRepository,
    private val roundRepository: KtuRoundRepository,
    private val contactRepository: KtuContactRepository,
    private val userRepository: UserRepository,
    private val invitationRepository: KtuInvitationRepository
) {
    @Transactional(readOnly = true)
    fun getAssignmentsByRound(roundId: Long): List<KtuAssignment> = assignmentRepository.findByRoundId(roundId)

    @Transactional(readOnly = true)
    fun getAssignment(id: Long): KtuAssignment? = assignmentRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun getAssignmentsByConsultant(consultantId: Long): List<KtuAssignment> =
        assignmentRepository.findByConsultantId(consultantId)

    @Transactional
    fun createAssignment(
        roundId: Long,
        consultantId: Long,
        contactId: Long,
        notes: String?,
        createdBy: User?
    ): KtuAssignment {
        val round = roundRepository.findById(roundId).orElse(null)
            ?: throw IllegalArgumentException("Runde med id $roundId finnes ikke")

        val consultant = userRepository.findById(consultantId).orElse(null)
            ?: throw IllegalArgumentException("Bruker med id $consultantId finnes ikke")

        val contact = contactRepository.findById(contactId).orElse(null)
            ?: throw IllegalArgumentException("Kontakt med id $contactId finnes ikke")

        // Check for duplicate
        if (assignmentRepository.existsByRoundIdAndConsultantIdAndContactId(roundId, consultantId, contactId)) {
            throw IllegalArgumentException("Denne tildelingen eksisterer allerede")
        }

        val assignment = KtuAssignment(
            round = round,
            consultant = consultant,
            contact = contact,
            notes = notes,
            createdBy = createdBy
        )
        return assignmentRepository.save(assignment)
    }

    @Transactional
    fun deleteAssignment(id: Long): Boolean {
        val assignment = assignmentRepository.findById(id).orElse(null) ?: return false

        // Check if any invitations exist
        val invitations = invitationRepository.findByAssignmentId(id)
        if (invitations.isNotEmpty()) {
            throw IllegalStateException("Kan ikke slette tildeling som har invitasjoner")
        }

        assignmentRepository.delete(assignment)
        return true
    }

    @Transactional(readOnly = true)
    fun hasInvitation(assignmentId: Long): Boolean {
        return invitationRepository.findByAssignmentId(assignmentId).isNotEmpty()
    }
}

@Service
class KtuInvitationService(
    private val invitationRepository: KtuInvitationRepository,
    private val assignmentRepository: KtuAssignmentRepository,
    private val roundRepository: KtuRoundRepository,
    private val emailService: KtuEmailService,
    private val organizationRepository: KtuOrganizationRepository,
    private val contactRepository: KtuContactRepository,
    private val userRepository: UserRepository
) {
    companion object {
        private const val TOKEN_LENGTH = 64
        private val ALLOWED_CHARS = ('a'..'z') + ('0'..'9')
    }

    @Transactional(readOnly = true)
    fun getInvitationsByRound(roundId: Long): List<KtuInvitation> = invitationRepository.findByRoundId(roundId)

    @Transactional(readOnly = true)
    fun getInvitationsByRoundAndStatus(roundId: Long, status: KtuInvitationStatus): List<KtuInvitation> =
        invitationRepository.findByRoundIdAndStatus(roundId, status)

    @Transactional(readOnly = true)
    fun getInvitationByToken(token: String): KtuInvitation? = invitationRepository.findByToken(token)

    @Transactional
    fun sendInvitations(roundId: Long, baseUrl: String): SendInvitationsResult {
        val round = roundRepository.findById(roundId).orElse(null)
            ?: throw IllegalArgumentException("Runde med id $roundId finnes ikke")

        if (round.status != KtuRoundStatus.OPEN) {
            throw IllegalStateException("Kan bare sende invitasjoner for runder med status OPEN")
        }

        val assignments = assignmentRepository.findByRoundId(roundId)
        var sentCount = 0
        var skippedCount = 0
        val errors = mutableListOf<String>()

        for (assignment in assignments) {
            // Check if invitation already exists
            val existingInvitations = invitationRepository.findByAssignmentId(assignment.id!!)
            if (existingInvitations.any { it.status in listOf(KtuInvitationStatus.PENDING, KtuInvitationStatus.SENT) }) {
                skippedCount++
                continue
            }

            // Check if contact has email
            val email = assignment.contact.email
            if (email.isNullOrBlank()) {
                skippedCount++
                errors.add("Kontakt ${assignment.contact.name} mangler e-postadresse")
                continue
            }

            try {
                val token = generateToken()
                val invitation = KtuInvitation(
                    assignment = assignment,
                    token = token,
                    status = KtuInvitationStatus.PENDING,
                    expiresAt = round.closeDate?.atTime(23, 59, 59)
                )
                val savedInvitation = invitationRepository.save(invitation)

                val surveyUrl = "$baseUrl/ktu/survey/$token"
                val success = emailService.sendInvitation(savedInvitation, surveyUrl)

                if (success) {
                    invitationRepository.save(savedInvitation.copy(
                        status = KtuInvitationStatus.SENT,
                        sentAt = LocalDateTime.now()
                    ))
                    sentCount++
                } else {
                    errors.add("Kunne ikke sende e-post til ${email}")
                }
            } catch (e: Exception) {
                errors.add("Feil ved sending til ${assignment.contact.name}: ${e.message}")
            }
        }

        return SendInvitationsResult(sentCount, skippedCount, errors)
    }

    @Transactional
    fun sendReminders(roundId: Long, baseUrl: String): SendRemindersResult {
        val round = roundRepository.findById(roundId).orElse(null)
            ?: throw IllegalArgumentException("Runde med id $roundId finnes ikke")

        if (round.status != KtuRoundStatus.OPEN) {
            throw IllegalStateException("Kan bare sende purringer for runder med status OPEN")
        }

        val invitations = invitationRepository.findByRoundIdAndStatus(roundId, KtuInvitationStatus.SENT)
        var sentCount = 0
        var skippedCount = 0
        val errors = mutableListOf<String>()

        for (invitation in invitations) {
            val email = invitation.assignment.contact.email
            if (email.isNullOrBlank()) {
                skippedCount++
                continue
            }

            try {
                val token = invitation.token ?: continue
                val surveyUrl = "$baseUrl/ktu/survey/$token"
                val success = emailService.sendReminder(invitation, surveyUrl, invitation.reminderCount + 1)

                if (success) {
                    invitationRepository.save(invitation.copy(
                        reminderCount = invitation.reminderCount + 1
                    ))
                    sentCount++
                } else {
                    errors.add("Kunne ikke sende purring til ${email}")
                }
            } catch (e: Exception) {
                errors.add("Feil ved sending til ${invitation.assignment.contact.name}: ${e.message}")
            }
        }

        return SendRemindersResult(sentCount, skippedCount, errors)
    }

    @Transactional
    fun markAsOpened(token: String): KtuInvitation? {
        val invitation = invitationRepository.findByToken(token) ?: return null
        if (invitation.openedAt == null) {
            return invitationRepository.save(invitation.copy(
                status = KtuInvitationStatus.OPENED,
                openedAt = LocalDateTime.now()
            ))
        }
        return invitation
    }

    @Transactional
    fun markAsResponded(token: String): KtuInvitation? {
        val invitation = invitationRepository.findByToken(token) ?: return null
        return invitationRepository.save(invitation.copy(
            status = KtuInvitationStatus.RESPONDED,
            respondedAt = LocalDateTime.now()
        ))
    }

    private fun generateToken(): String {
        return (1..TOKEN_LENGTH)
            .map { ALLOWED_CHARS.random() }
            .joinToString("")
    }

    /**
     * Creates a test survey invitation for testing purposes.
     * This creates temporary test entities (organization, contact, assignment) and an invitation.
     * Optionally sends an email to the specified address.
     */
    @Transactional
    fun createTestSurvey(
        round: KtuRound,
        email: String?,
        consultantName: String,
        contactName: String,
        organizationName: String,
        baseUrl: String
    ): TestSurveyResult {
        val testPrefix = "[KTU-TEST]"

        // Find or create test organization
        val testOrgName = "$testPrefix $organizationName"
        val organization = organizationRepository.findByNameIgnoreCase(testOrgName)
            ?: organizationRepository.save(KtuCustomerOrganization(
                name = testOrgName,
                organizationNumber = "TEST-${System.currentTimeMillis()}",
                active = true
            ))

        // Find or create test contact (using the provided email or a dummy)
        val contactEmail = email ?: "test-${System.currentTimeMillis()}@ktu-test.invalid"
        val testContactName = "$testPrefix $contactName"
        val contact = contactRepository.save(KtuCustomerContact(
            name = testContactName,
            email = contactEmail,
            organization = organization,
            active = true
        ))

        // Find or create test consultant user
        val testUserEmail = "ktu-test-consultant@jpro.no"
        val consultant = userRepository.findUserByEmail(testUserEmail)
            ?: userRepository.save(User(
                email = testUserEmail,
                name = "$testPrefix $consultantName",
                givenName = "Test",
                familyName = "Konsulent",
                sub = "ktu-test-${System.currentTimeMillis()}",
                budgets = emptyList(),
                enabled = false  // Disabled so it doesn't show in normal user lists
            ))

        // Create test assignment
        val assignment = assignmentRepository.save(KtuAssignment(
            round = round,
            consultant = consultant,
            contact = contact,
            notes = "Test tildeling opprettet for testing av undersøkelsesflyt"
        ))

        // Create invitation with token
        val token = generateToken()
        val expiresAt = LocalDateTime.now().plusDays(7)  // Test invitations expire in 7 days
        val invitation = invitationRepository.save(KtuInvitation(
            assignment = assignment,
            token = token,
            status = KtuInvitationStatus.PENDING,
            expiresAt = expiresAt
        ))

        val surveyUrl = "$baseUrl/ktu/survey/$token"
        var emailSent = false
        var emailSentTo: String? = null

        // Send email if address was provided
        if (!email.isNullOrBlank()) {
            try {
                val success = emailService.sendInvitation(invitation, surveyUrl)
                if (success) {
                    invitationRepository.save(invitation.copy(
                        status = KtuInvitationStatus.SENT,
                        sentAt = LocalDateTime.now()
                    ))
                    emailSent = true
                    emailSentTo = email
                }
            } catch (e: Exception) {
                // Log but don't fail - the URL is still valid for testing
            }
        }

        return TestSurveyResult(
            surveyUrl = surveyUrl,
            token = token,
            emailSent = emailSent,
            emailSentTo = emailSentTo,
            expiresAt = expiresAt
        )
    }
}

data class SendInvitationsResult(
    val sentCount: Int,
    val skippedCount: Int,
    val errors: List<String>
)

data class SendRemindersResult(
    val sentCount: Int,
    val skippedCount: Int,
    val errors: List<String>
)

data class TestSurveyResult(
    val surveyUrl: String,
    val token: String,
    val emailSent: Boolean,
    val emailSentTo: String?,
    val expiresAt: LocalDateTime?
)
