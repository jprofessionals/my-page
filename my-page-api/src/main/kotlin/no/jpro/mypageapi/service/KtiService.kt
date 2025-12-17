package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.entity.kti.*
import no.jpro.mypageapi.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class KtiRoundService(
    private val roundRepository: KtiRoundRepository
) {
    @Transactional(readOnly = true)
    fun getAllRounds(): List<KtiRound> = roundRepository.findAll()

    @Transactional(readOnly = true)
    fun getRoundsByStatus(status: KtiRoundStatus): List<KtiRound> = roundRepository.findByStatus(status)

    @Transactional(readOnly = true)
    fun getRound(id: Long): KtiRound? = roundRepository.findById(id).orElse(null)

    @Transactional
    fun createRound(name: String, year: Int, openDate: LocalDate?, closeDate: LocalDate?, createdBy: User?): KtiRound {
        val round = KtiRound(
            name = name,
            year = year,
            status = KtiRoundStatus.DRAFT,
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
        status: KtiRoundStatus?
    ): KtiRound? {
        val existing = roundRepository.findById(id).orElse(null) ?: return null

        val updated = existing.copy(
            name = name ?: existing.name,
            openDate = openDate ?: existing.openDate,
            closeDate = closeDate ?: existing.closeDate,
            status = status ?: existing.status,
            updatedAt = LocalDateTime.now()
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
class KtiOrganizationService(
    private val organizationRepository: KtiOrganizationRepository
) {
    @Transactional(readOnly = true)
    fun getAllOrganizations(): List<KtiCustomerOrganization> = organizationRepository.findAll()

    @Transactional(readOnly = true)
    fun getActiveOrganizations(): List<KtiCustomerOrganization> = organizationRepository.findByActive(true)

    @Transactional(readOnly = true)
    fun getOrganization(id: Long): KtiCustomerOrganization? = organizationRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun getOrganizationByName(name: String): KtiCustomerOrganization? = organizationRepository.findByNameIgnoreCase(name)

    @Transactional
    fun createOrganization(name: String, organizationNumber: String?): KtiCustomerOrganization {
        if (organizationRepository.existsByNameIgnoreCase(name)) {
            throw IllegalArgumentException("Organisasjon med navn '$name' eksisterer allerede")
        }
        val organization = KtiCustomerOrganization(
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
    ): KtiCustomerOrganization? {
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
    fun getOrCreateOrganization(name: String): KtiCustomerOrganization {
        return organizationRepository.findByNameIgnoreCase(name)
            ?: createOrganization(name, null)
    }
}

@Service
class KtiContactService(
    private val contactRepository: KtiContactRepository,
    private val organizationRepository: KtiOrganizationRepository
) {
    @Transactional(readOnly = true)
    fun getAllContacts(): List<KtiCustomerContact> = contactRepository.findAll()

    @Transactional(readOnly = true)
    fun getActiveContacts(): List<KtiCustomerContact> = contactRepository.findByActive(true)

    @Transactional(readOnly = true)
    fun getContactsByOrganization(organizationId: Long, activeOnly: Boolean): List<KtiCustomerContact> {
        return if (activeOnly) {
            contactRepository.findByOrganizationIdAndActive(organizationId, true)
        } else {
            contactRepository.findByOrganizationId(organizationId)
        }
    }

    @Transactional(readOnly = true)
    fun getContact(id: Long): KtiCustomerContact? = contactRepository.findById(id).orElse(null)

    @Transactional
    fun createContact(
        name: String,
        email: String?,
        phone: String?,
        title: String?,
        organizationId: Long
    ): KtiCustomerContact {
        val organization = organizationRepository.findById(organizationId).orElse(null)
            ?: throw IllegalArgumentException("Organisasjon med id $organizationId finnes ikke")

        val contact = KtiCustomerContact(
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
    ): KtiCustomerContact? {
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
class KtiQuestionService(
    private val questionRepository: KtiQuestionRepository
) {
    @Transactional(readOnly = true)
    fun getAllQuestions(): List<KtiQuestion> = questionRepository.findAllByOrderByDisplayOrder()

    @Transactional(readOnly = true)
    fun getActiveQuestions(): List<KtiQuestion> = questionRepository.findByActiveOrderByDisplayOrder(true)

    @Transactional(readOnly = true)
    fun getQuestion(id: Long): KtiQuestion? = questionRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun getQuestionByCode(code: String): KtiQuestion? = questionRepository.findByCode(code)

    @Transactional
    fun createQuestion(
        code: String,
        textNo: String,
        textEn: String?,
        questionType: KtiQuestionType,
        category: String,
        displayOrder: Int,
        required: Boolean = true
    ): KtiQuestion {
        if (questionRepository.findByCode(code) != null) {
            throw IllegalArgumentException("Sporsmal med kode '$code' eksisterer allerede")
        }
        val question = KtiQuestion(
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
        questionType: KtiQuestionType?,
        category: String?,
        displayOrder: Int?,
        active: Boolean?,
        required: Boolean?
    ): KtiQuestion? {
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
class KtiAssignmentService(
    private val assignmentRepository: KtiAssignmentRepository,
    private val roundRepository: KtiRoundRepository,
    private val contactRepository: KtiContactRepository,
    private val userRepository: UserRepository,
    private val invitationRepository: KtiInvitationRepository
) {
    @Transactional(readOnly = true)
    fun getAssignmentsByRound(roundId: Long): List<KtiAssignment> = assignmentRepository.findByRoundId(roundId)

    @Transactional(readOnly = true)
    fun getAssignment(id: Long): KtiAssignment? = assignmentRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun getAssignmentsByConsultant(consultantId: Long): List<KtiAssignment> =
        assignmentRepository.findByConsultantId(consultantId)

    @Transactional
    fun createAssignment(
        roundId: Long,
        consultantId: Long,
        contactId: Long,
        notes: String?,
        createdBy: User?
    ): KtiAssignment {
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

        val assignment = KtiAssignment(
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
class KtiInvitationService(
    private val invitationRepository: KtiInvitationRepository,
    private val assignmentRepository: KtiAssignmentRepository,
    private val roundRepository: KtiRoundRepository,
    private val emailService: KtiEmailService
) {
    companion object {
        private const val TOKEN_LENGTH = 64
        private val ALLOWED_CHARS = ('a'..'z') + ('0'..'9')
    }

    @Transactional(readOnly = true)
    fun getInvitationsByRound(roundId: Long): List<KtiInvitation> = invitationRepository.findByRoundId(roundId)

    @Transactional(readOnly = true)
    fun getInvitationsByRoundAndStatus(roundId: Long, status: KtiInvitationStatus): List<KtiInvitation> =
        invitationRepository.findByRoundIdAndStatus(roundId, status)

    @Transactional(readOnly = true)
    fun getInvitationByToken(token: String): KtiInvitation? = invitationRepository.findByToken(token)

    @Transactional
    fun sendInvitations(roundId: Long, baseUrl: String): SendInvitationsResult {
        val round = roundRepository.findById(roundId).orElse(null)
            ?: throw IllegalArgumentException("Runde med id $roundId finnes ikke")

        if (round.status != KtiRoundStatus.OPEN) {
            throw IllegalStateException("Kan bare sende invitasjoner for runder med status OPEN")
        }

        val assignments = assignmentRepository.findByRoundId(roundId)
        var sentCount = 0
        var skippedCount = 0
        val errors = mutableListOf<String>()

        for (assignment in assignments) {
            // Check if invitation already exists
            val existingInvitations = invitationRepository.findByAssignmentId(assignment.id!!)
            if (existingInvitations.any { it.status in listOf(KtiInvitationStatus.PENDING, KtiInvitationStatus.SENT) }) {
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
                val invitation = KtiInvitation(
                    assignment = assignment,
                    token = token,
                    status = KtiInvitationStatus.PENDING,
                    expiresAt = round.closeDate?.atTime(23, 59, 59)
                )
                val savedInvitation = invitationRepository.save(invitation)

                val surveyUrl = "$baseUrl/kti/survey/$token"
                val success = emailService.sendInvitation(savedInvitation, surveyUrl)

                if (success) {
                    invitationRepository.save(savedInvitation.copy(
                        status = KtiInvitationStatus.SENT,
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

        if (round.status != KtiRoundStatus.OPEN) {
            throw IllegalStateException("Kan bare sende purringer for runder med status OPEN")
        }

        val invitations = invitationRepository.findByRoundIdAndStatus(roundId, KtiInvitationStatus.SENT)
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
                val surveyUrl = "$baseUrl/kti/survey/$token"
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
    fun markAsOpened(token: String): KtiInvitation? {
        val invitation = invitationRepository.findByToken(token) ?: return null
        if (invitation.openedAt == null) {
            return invitationRepository.save(invitation.copy(
                status = KtiInvitationStatus.OPENED,
                openedAt = LocalDateTime.now()
            ))
        }
        return invitation
    }

    @Transactional
    fun markAsResponded(token: String): KtiInvitation? {
        val invitation = invitationRepository.findByToken(token) ?: return null
        return invitationRepository.save(invitation.copy(
            status = KtiInvitationStatus.RESPONDED,
            respondedAt = LocalDateTime.now()
        ))
    }

    private fun generateToken(): String {
        return (1..TOKEN_LENGTH)
            .map { ALLOWED_CHARS.random() }
            .joinToString("")
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
