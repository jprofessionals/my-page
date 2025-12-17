package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.KtiApiDelegate
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.entity.kti.KtiAssignment as KtiAssignmentEntity
import no.jpro.mypageapi.entity.kti.KtiConsultantAlias as KtiConsultantAliasEntity
import no.jpro.mypageapi.entity.kti.KtiCustomerContact as KtiContactEntity
import no.jpro.mypageapi.entity.kti.KtiCustomerOrganization as KtiOrganizationEntity
import no.jpro.mypageapi.entity.kti.KtiInvitation as KtiInvitationEntity
import no.jpro.mypageapi.entity.kti.KtiInvitationStatus as KtiInvitationStatusEntity
import no.jpro.mypageapi.entity.kti.KtiQuestion as KtiQuestionEntity
import no.jpro.mypageapi.entity.kti.KtiQuestionType as KtiQuestionTypeEntity
import no.jpro.mypageapi.entity.kti.KtiResponse as KtiResponseEntity
import no.jpro.mypageapi.entity.kti.KtiRound as KtiRoundEntity
import no.jpro.mypageapi.entity.kti.KtiRoundQuestion as KtiRoundQuestionEntity
import no.jpro.mypageapi.entity.kti.KtiRoundStatus as KtiRoundStatusEntity
import no.jpro.mypageapi.model.*
import no.jpro.mypageapi.repository.KtiConsultantAliasRepository
import no.jpro.mypageapi.repository.KtiInvitationRepository
import no.jpro.mypageapi.repository.KtiResponseRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.KtiAssignmentService
import no.jpro.mypageapi.service.KtiContactImportService
import no.jpro.mypageapi.service.KtiContactService
import no.jpro.mypageapi.service.KtiImportService
import no.jpro.mypageapi.service.KtiInvitationService
import no.jpro.mypageapi.service.KtiOrganizationService
import no.jpro.mypageapi.service.KtiQuestionService
import no.jpro.mypageapi.service.KtiRoundQuestionService
import no.jpro.mypageapi.service.KtiRoundService
import no.jpro.mypageapi.service.KtiStatisticsService
import no.jpro.mypageapi.service.UserSyncService
import no.jpro.mypageapi.utils.AuthenticationHelper
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.multipart.MultipartFile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.time.OffsetDateTime
import java.time.ZoneId
import java.util.*

@Service
class KtiApiDelegateImpl(
    private val roundService: KtiRoundService,
    private val organizationService: KtiOrganizationService,
    private val contactService: KtiContactService,
    private val questionService: KtiQuestionService,
    private val roundQuestionService: KtiRoundQuestionService,
    private val assignmentService: KtiAssignmentService,
    private val invitationService: KtiInvitationService,
    private val importService: KtiImportService,
    private val contactImportService: KtiContactImportService,
    private val statisticsService: KtiStatisticsService,
    private val userSyncService: UserSyncService,
    private val userRepository: UserRepository,
    private val consultantAliasRepository: KtiConsultantAliasRepository,
    private val responseRepository: KtiResponseRepository,
    private val invitationRepository: KtiInvitationRepository,
    private val authenticationHelper: AuthenticationHelper,
    private val request: Optional<NativeWebRequest>,
    @Value("\${app.base-url:http://localhost:3000}") private val baseUrl: String
) : KtiApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    // === Rounds ===

    override fun getKtiRounds(status: KtiRoundStatus?): ResponseEntity<List<KtiRound>> {
        val rounds = if (status != null) {
            roundService.getRoundsByStatus(toEntityStatus(status))
        } else {
            roundService.getAllRounds()
        }
        return ResponseEntity.ok(rounds.map { toRoundModel(it) })
    }

    override fun getKtiRound(roundId: Long): ResponseEntity<KtiRound> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toRoundModel(round))
    }

    @RequiresAdmin
    override fun createKtiRound(createKtiRound: CreateKtiRound): ResponseEntity<KtiRound> {
        val currentUser = authenticationHelper.getCurrentUser()
        return try {
            val round = roundService.createRound(
                name = createKtiRound.name,
                year = createKtiRound.year,
                openDate = createKtiRound.openDate,
                closeDate = createKtiRound.closeDate,
                createdBy = currentUser
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toRoundModel(round))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtiRound(roundId: Long, updateKtiRound: UpdateKtiRound): ResponseEntity<KtiRound> {
        return try {
            val round = roundService.updateRound(
                id = roundId,
                name = updateKtiRound.name,
                openDate = updateKtiRound.openDate,
                closeDate = updateKtiRound.closeDate,
                status = updateKtiRound.status?.let { toEntityStatus(it) }
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toRoundModel(round))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun deleteKtiRound(roundId: Long): ResponseEntity<Unit> {
        return try {
            if (roundService.deleteRound(roundId)) {
                ResponseEntity.noContent().build()
            } else {
                ResponseEntity.notFound().build()
            }
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Organizations ===

    override fun getKtiOrganizations(activeOnly: Boolean): ResponseEntity<List<KtiCustomerOrganization>> {
        val organizations = if (activeOnly) {
            organizationService.getActiveOrganizations()
        } else {
            organizationService.getAllOrganizations()
        }
        return ResponseEntity.ok(organizations.map { toOrganizationModel(it) })
    }

    override fun getKtiOrganization(organizationId: Long): ResponseEntity<KtiCustomerOrganization> {
        val organization = organizationService.getOrganization(organizationId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toOrganizationModel(organization))
    }

    @RequiresAdmin
    override fun createKtiOrganization(createKtiOrganization: CreateKtiOrganization): ResponseEntity<KtiCustomerOrganization> {
        return try {
            val organization = organizationService.createOrganization(
                name = createKtiOrganization.name,
                organizationNumber = createKtiOrganization.organizationNumber
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toOrganizationModel(organization))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtiOrganization(
        organizationId: Long,
        updateKtiOrganization: UpdateKtiOrganization
    ): ResponseEntity<KtiCustomerOrganization> {
        return try {
            val organization = organizationService.updateOrganization(
                id = organizationId,
                name = updateKtiOrganization.name,
                organizationNumber = updateKtiOrganization.organizationNumber,
                active = updateKtiOrganization.active
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toOrganizationModel(organization))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Contacts ===

    override fun getKtiContacts(organizationId: Long?, activeOnly: Boolean): ResponseEntity<List<KtiCustomerContact>> {
        val contacts = if (organizationId != null) {
            contactService.getContactsByOrganization(organizationId, activeOnly)
        } else if (activeOnly) {
            contactService.getActiveContacts()
        } else {
            contactService.getAllContacts()
        }
        return ResponseEntity.ok(contacts.map { toContactModel(it) })
    }

    override fun getKtiContact(contactId: Long): ResponseEntity<KtiCustomerContact> {
        val contact = contactService.getContact(contactId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toContactModel(contact))
    }

    @RequiresAdmin
    override fun createKtiContact(createKtiContact: CreateKtiContact): ResponseEntity<KtiCustomerContact> {
        return try {
            val contact = contactService.createContact(
                name = createKtiContact.name,
                email = createKtiContact.email,
                phone = createKtiContact.phone,
                title = createKtiContact.title,
                organizationId = createKtiContact.organizationId
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toContactModel(contact))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtiContact(
        contactId: Long,
        updateKtiContact: UpdateKtiContact
    ): ResponseEntity<KtiCustomerContact> {
        return try {
            val contact = contactService.updateContact(
                id = contactId,
                name = updateKtiContact.name,
                email = updateKtiContact.email,
                phone = updateKtiContact.phone,
                title = updateKtiContact.title,
                organizationId = updateKtiContact.organizationId,
                active = updateKtiContact.active,
                optedOut = updateKtiContact.optedOut
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toContactModel(contact))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Questions ===

    override fun getKtiQuestions(activeOnly: Boolean): ResponseEntity<List<KtiQuestion>> {
        val questions = if (activeOnly) {
            questionService.getActiveQuestions()
        } else {
            questionService.getAllQuestions()
        }
        return ResponseEntity.ok(questions.map { toQuestionModel(it) })
    }

    @RequiresAdmin
    override fun createKtiQuestion(createKtiQuestion: CreateKtiQuestion): ResponseEntity<KtiQuestion> {
        return try {
            val question = questionService.createQuestion(
                code = createKtiQuestion.code,
                textNo = createKtiQuestion.textNo,
                textEn = createKtiQuestion.textEn,
                questionType = toEntityQuestionType(createKtiQuestion.questionType),
                category = createKtiQuestion.category,
                displayOrder = createKtiQuestion.displayOrder,
                required = createKtiQuestion.required ?: true
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toQuestionModel(question))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtiQuestion(questionId: Long, updateKtiQuestion: UpdateKtiQuestion): ResponseEntity<KtiQuestion> {
        return try {
            val question = questionService.updateQuestion(
                id = questionId,
                code = updateKtiQuestion.code,
                textNo = updateKtiQuestion.textNo,
                textEn = updateKtiQuestion.textEn,
                questionType = updateKtiQuestion.questionType?.let { toEntityQuestionType(it) },
                category = updateKtiQuestion.category,
                displayOrder = updateKtiQuestion.displayOrder,
                active = updateKtiQuestion.active,
                required = updateKtiQuestion.required
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toQuestionModel(question))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Round Questions ===

    override fun getKtiRoundQuestions(roundId: Long, activeOnly: Boolean): ResponseEntity<List<KtiRoundQuestion>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val roundQuestions = roundQuestionService.getQuestionsForRound(roundId, activeOnly)
        return ResponseEntity.ok(roundQuestions.map { toRoundQuestionModel(it) })
    }

    @RequiresAdmin
    override fun addKtiRoundQuestion(roundId: Long, addKtiRoundQuestion: AddKtiRoundQuestion): ResponseEntity<KtiRoundQuestion> {
        return try {
            val roundQuestion = roundQuestionService.addQuestionToRound(
                roundId = roundId,
                questionId = addKtiRoundQuestion.questionId,
                displayOrder = addKtiRoundQuestion.displayOrder,
                active = addKtiRoundQuestion.active ?: true
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toRoundQuestionModel(roundQuestion))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtiRoundQuestion(
        roundId: Long,
        questionId: Long,
        updateKtiRoundQuestion: UpdateKtiRoundQuestion
    ): ResponseEntity<KtiRoundQuestion> {
        val roundQuestion = roundQuestionService.updateRoundQuestion(
            roundId = roundId,
            questionId = questionId,
            displayOrder = updateKtiRoundQuestion.displayOrder,
            active = updateKtiRoundQuestion.active
        ) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toRoundQuestionModel(roundQuestion))
    }

    @RequiresAdmin
    override fun removeKtiRoundQuestion(roundId: Long, questionId: Long): ResponseEntity<Unit> {
        return if (roundQuestionService.removeQuestionFromRound(roundId, questionId)) {
            ResponseEntity.noContent().build()
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @RequiresAdmin
    override fun copyKtiRoundQuestions(roundId: Long, sourceRoundId: Long): ResponseEntity<List<KtiRoundQuestion>> {
        return try {
            val roundQuestions = roundQuestionService.copyQuestionsFromRound(roundId, sourceRoundId)
            ResponseEntity.status(HttpStatus.CREATED).body(roundQuestions.map { toRoundQuestionModel(it) })
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun initKtiRoundQuestionsFromTemplate(roundId: Long): ResponseEntity<List<KtiRoundQuestion>> {
        return try {
            val roundQuestions = roundQuestionService.initFromGlobalQuestions(roundId)
            ResponseEntity.status(HttpStatus.CREATED).body(roundQuestions.map { toRoundQuestionModel(it) })
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Import ===

    @RequiresAdmin
    override fun previewKtiCsv(file: MultipartFile): ResponseEntity<KtiCsvPreview> {
        return try {
            val preview = importService.previewCsv(file)
            ResponseEntity.ok(KtiCsvPreview(
                columns = preview.columns,
                sampleRows = preview.sampleRows,
                totalRows = preview.totalRows,
                delimiter = preview.delimiter,
                requiredFields = preview.requiredFields.map { field ->
                    KtiImportField(
                        key = field.key,
                        label = field.label,
                        required = field.required,
                        type = KtiImportField.Type.valueOf(field.type.name)
                    )
                }
            ))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun importHistoricalKti(
        file: MultipartFile,
        dryRun: Boolean,
        skipUnmatchedConsultants: Boolean,
        columnMapping: String?
    ): ResponseEntity<KtiImportResult> {
        return try {
            val currentUser = authenticationHelper.getCurrentUser()
            val result = importService.importHistoricalData(
                file = file,
                dryRun = dryRun,
                skipUnmatchedConsultants = skipUnmatchedConsultants,
                importedBy = currentUser,
                columnMappingJson = columnMapping
            )
            ResponseEntity.ok(toImportResultModel(result))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    private fun toImportResultModel(result: no.jpro.mypageapi.service.ImportResult): KtiImportResult {
        return KtiImportResult(
            valid = result.valid,
            dryRun = result.dryRun,
            totalRows = result.totalRows,
            validRows = result.validRows,
            importedResponses = result.importedResponses,
            skippedRows = result.skippedRows,
            errors = result.errors.map { error ->
                KtiImportError(
                    row = error.row,
                    field = error.field,
                    value = error.value,
                    error = error.error
                )
            },
            newOrganizations = result.newOrganizations,
            newContacts = result.newContacts,
            roundsToCreate = result.roundsToCreate,
            createdRounds = result.createdRounds,
            unmatchedConsultants = result.unmatchedConsultants.map { unmatched ->
                UnmatchedConsultant(
                    name = unmatched.name,
                    rowCount = unmatched.rowCount,
                    suggestions = unmatched.suggestions.map { suggestion ->
                        SuggestedMatch(
                            userId = suggestion.userId,
                            userName = suggestion.userName,
                            similarity = suggestion.similarity
                        )
                    }
                )
            }
        )
    }

    // === Contacts Import ===

    @RequiresAdmin
    override fun previewContactsCsv(file: MultipartFile): ResponseEntity<KtiContactsCsvPreview> {
        return try {
            val preview = contactImportService.previewCsv(file)
            ResponseEntity.ok(KtiContactsCsvPreview(
                columns = preview.columns,
                sampleRows = preview.sampleRows,
                totalRows = preview.totalRows,
                delimiter = preview.delimiter,
                requiredFields = preview.requiredFields.map { field ->
                    KtiImportField(
                        key = field.key,
                        label = field.label,
                        required = field.required,
                        type = KtiImportField.Type.TEXT
                    )
                }
            ))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun importContacts(
        file: MultipartFile,
        dryRun: Boolean,
        year: Int?,
        columnMapping: String?
    ): ResponseEntity<KtiContactsImportResult> {
        return try {
            val result = contactImportService.importContacts(
                file = file,
                dryRun = dryRun,
                columnMappingJson = columnMapping,
                year = year
            )
            ResponseEntity.ok(KtiContactsImportResult(
                valid = result.valid,
                dryRun = result.dryRun,
                totalRows = result.totalRows,
                validRows = result.validRows,
                skippedRows = result.skippedRows,
                createdOrganizations = result.createdOrganizations,
                createdContacts = result.createdContacts,
                updatedContacts = result.updatedContacts,
                createdAssignments = result.createdAssignments,
                errors = result.errors.map { error ->
                    KtiImportError(
                        row = error.row,
                        field = error.field,
                        value = error.value,
                        error = error.error
                    )
                },
                unmatchedConsultants = result.unmatchedConsultants.map { unmatched ->
                    UnmatchedConsultant(
                        name = unmatched.name,
                        rowCount = unmatched.rowCount,
                        suggestions = unmatched.suggestions.map { suggestion ->
                            SuggestedMatch(
                                userId = suggestion.userId,
                                userName = suggestion.userName,
                                similarity = suggestion.similarity
                            )
                        }
                    )
                }
            ))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Assignments ===

    @RequiresAdmin
    override fun getKtiAssignments(roundId: Long): ResponseEntity<List<KtiAssignment>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val assignments = assignmentService.getAssignmentsByRound(roundId)
        return ResponseEntity.ok(assignments.map { toAssignmentModel(it) })
    }

    @RequiresAdmin
    override fun getKtiAssignment(roundId: Long, assignmentId: Long): ResponseEntity<KtiAssignment> {
        val assignment = assignmentService.getAssignment(assignmentId)
            ?: return ResponseEntity.notFound().build()
        if (assignment.round.id != roundId) {
            return ResponseEntity.notFound().build()
        }
        return ResponseEntity.ok(toAssignmentModel(assignment))
    }

    @RequiresAdmin
    override fun createKtiAssignment(roundId: Long, createKtiAssignment: CreateKtiAssignment): ResponseEntity<KtiAssignment> {
        return try {
            val currentUser = authenticationHelper.getCurrentUser()
            val assignment = assignmentService.createAssignment(
                roundId = roundId,
                consultantId = createKtiAssignment.consultantId,
                contactId = createKtiAssignment.contactId,
                notes = createKtiAssignment.notes,
                createdBy = currentUser
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toAssignmentModel(assignment))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun deleteKtiAssignment(roundId: Long, assignmentId: Long): ResponseEntity<Unit> {
        return try {
            val assignment = assignmentService.getAssignment(assignmentId)
                ?: return ResponseEntity.notFound().build()
            if (assignment.round.id != roundId) {
                return ResponseEntity.notFound().build()
            }
            if (assignmentService.deleteAssignment(assignmentId)) {
                ResponseEntity.noContent().build()
            } else {
                ResponseEntity.notFound().build()
            }
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Invitations ===

    @RequiresAdmin
    override fun getKtiInvitations(roundId: Long, status: KtiInvitationStatus?): ResponseEntity<List<KtiInvitation>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val invitations = if (status != null) {
            invitationService.getInvitationsByRoundAndStatus(roundId, toEntityInvitationStatus(status))
        } else {
            invitationService.getInvitationsByRound(roundId)
        }
        return ResponseEntity.ok(invitations.map { toInvitationModel(it) })
    }

    @RequiresAdmin
    override fun sendKtiInvitations(roundId: Long): ResponseEntity<KtiSendInvitationsResult> {
        return try {
            val result = invitationService.sendInvitations(roundId, baseUrl)
            ResponseEntity.ok(KtiSendInvitationsResult(
                sentCount = result.sentCount,
                skippedCount = result.skippedCount,
                errors = result.errors
            ))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun sendKtiReminders(roundId: Long): ResponseEntity<KtiSendRemindersResult> {
        return try {
            val result = invitationService.sendReminders(roundId, baseUrl)
            ResponseEntity.ok(KtiSendRemindersResult(
                sentCount = result.sentCount,
                skippedCount = result.skippedCount,
                errors = result.errors
            ))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.notFound().build()
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Consultants ===

    @RequiresAdmin
    override fun getKtiConsultants(): ResponseEntity<List<KtiConsultant>> {
        val users = userRepository.findAll()
        return ResponseEntity.ok(users.map { toConsultantModel(it) })
    }

    // === User Sync ===

    @RequiresAdmin
    override fun syncUsersFromFlowcase(): ResponseEntity<UserSyncResult> {
        val result = userSyncService.syncFromFlowcase()
        return ResponseEntity.ok(UserSyncResult(
            totalFromFlowcase = result.totalFromFlowcase,
            created = result.created,
            updated = result.updated,
            skipped = result.skipped,
            errors = result.errors
        ))
    }

    // === Consultant Aliases ===

    override fun getConsultantAliases(): ResponseEntity<List<ConsultantAlias>> {
        val aliases = consultantAliasRepository.findAll()
        return ResponseEntity.ok(aliases.map { toAliasModel(it) })
    }

    @RequiresAdmin
    override fun createConsultantAlias(createConsultantAliasRequest: CreateConsultantAliasRequest): ResponseEntity<ConsultantAlias> {
        // Check if alias already exists
        if (consultantAliasRepository.existsByAliasNameIgnoreCase(createConsultantAliasRequest.aliasName)) {
            return ResponseEntity.badRequest().build()
        }

        // If userId is provided, find user; otherwise create an "ignore" alias for former employees
        val user = createConsultantAliasRequest.userId?.let { userId ->
            userRepository.findById(userId).orElse(null)
                ?: return ResponseEntity.badRequest().build()
        }

        val alias = consultantAliasRepository.save(KtiConsultantAliasEntity(
            aliasName = createConsultantAliasRequest.aliasName,
            user = user  // null means "ignore this consultant" (former employee)
        ))

        return ResponseEntity.status(HttpStatus.CREATED).body(toAliasModel(alias))
    }

    @RequiresAdmin
    override fun deleteConsultantAlias(aliasId: Long): ResponseEntity<Unit> {
        if (!consultantAliasRepository.existsById(aliasId)) {
            return ResponseEntity.notFound().build()
        }
        consultantAliasRepository.deleteById(aliasId)
        return ResponseEntity.noContent().build()
    }

    // === KTI Users ===

    override fun getKtiUsers(): ResponseEntity<List<KtiUser>> {
        val users = userRepository.findByEnabled(true)
        return ResponseEntity.ok(users.map { user ->
            KtiUser(
                id = user.id!!,
                name = user.name ?: "Ukjent",
                email = user.email
            )
        })
    }

    // === Statistics ===

    override fun getKtiRoundStatistics(roundId: Long): ResponseEntity<KtiRoundStatistics> {
        val stats = statisticsService.getRoundStatistics(roundId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(KtiRoundStatistics(
            roundId = stats.roundId,
            roundName = stats.roundName,
            totalInvitations = stats.totalInvitations,
            totalResponses = stats.totalResponses,
            responseRate = stats.responseRate,
            averageScore = stats.averageScore,
            consultantCount = stats.consultantCount,
            organizationCount = stats.organizationCount,
            scoreDistribution = stats.scoreDistribution.mapKeys { it.key.toString() },
            invitationsByStatus = stats.invitationsByStatus,
            questionStatistics = stats.questionStatistics.map { qs ->
                KtiQuestionStatistics(
                    questionId = qs.questionId,
                    questionCode = qs.questionCode,
                    questionText = qs.questionText,
                    averageScore = qs.averageScore,
                    responseCount = qs.responseCount,
                    scoreDistribution = qs.scoreDistribution.mapKeys { it.key.toString() }
                )
            }
        ))
    }

    override fun getKtiRoundResponses(roundId: Long): ResponseEntity<List<KtiResponseSummary>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val responses = statisticsService.getRoundResponses(roundId)
        return ResponseEntity.ok(responses.map { response ->
            KtiResponseSummary(
                id = response.id,
                consultantId = response.consultantId,
                consultantName = response.consultantName,
                organizationId = response.organizationId,
                organizationName = response.organizationName,
                contactId = response.contactId,
                contactName = response.contactName,
                contactEmail = response.contactEmail,
                averageScore = response.averageScore,
                respondedAt = response.respondedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
                questionResponses = response.questionResponses.map { qr ->
                    KtiQuestionResponse(
                        id = qr.id,
                        questionId = qr.questionId,
                        questionCode = qr.questionCode,
                        questionText = qr.questionText,
                        questionType = KtiQuestionType.valueOf(qr.questionType.name),
                        ratingValue = qr.ratingValue,
                        textValue = qr.textValue
                    )
                }
            )
        })
    }

    override fun getKtiStatisticsByConsultant(roundId: Long): ResponseEntity<List<KtiConsultantStatistics>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val stats = statisticsService.getStatisticsByConsultant(roundId)
        return ResponseEntity.ok(stats.map { s ->
            KtiConsultantStatistics(
                consultantId = s.consultantId,
                consultantName = s.consultantName,
                responseCount = s.responseCount,
                averageScore = s.averageScore,
                organizationCount = s.organizationCount,
                scoreDistribution = s.scoreDistribution.mapKeys { it.key.toString() }
            )
        })
    }

    override fun getKtiCompanyTrends(): ResponseEntity<KtiCompanyTrendStatistics> {
        val trends = statisticsService.getCompanyTrendStatistics()
        return ResponseEntity.ok(KtiCompanyTrendStatistics(
            yearlyStatistics = trends.yearlyStatistics.map { ys ->
                KtiYearlyStatistics(
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
                KtiQuestionTrend(
                    questionId = qt.questionId,
                    questionCode = qt.questionCode,
                    questionText = qt.questionText,
                    yearlyAverages = qt.yearlyAverages
                        .filterValues { it != null }
                        .mapKeys { it.key.toString() }
                        .mapValues { it.value!! }
                )
            },
            overallTrend = trends.overallTrend
                .filterValues { it != null }
                .mapKeys { it.key.toString() }
                .mapValues { it.value!! }
        ))
    }

    override fun getKtiConsultantsTrends(): ResponseEntity<List<KtiConsultantYearlyStats>> {
        val trends = statisticsService.getConsultantsTrendStatistics()
        return ResponseEntity.ok(trends.map { cs ->
            KtiConsultantYearlyStats(
                consultantId = cs.consultantId,
                consultantName = cs.consultantName,
                email = cs.email,
                yearlyData = cs.yearlyData.mapKeys { it.key.toString() }.mapValues { (_, data) ->
                    KtiConsultantYearData(
                        responseCount = data.responseCount,
                        averageScore = data.averageScore,
                        organizationCount = data.organizationCount
                    )
                }
            )
        })
    }

    // === My KTI (Consultant's own data) ===

    override fun getKtiMyStatistics(): ResponseEntity<KtiConsultantOwnStatistics> {
        val currentUser = authenticationHelper.getCurrentUser()
            ?: return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build()
        val consultantId = currentUser.id ?: return ResponseEntity.notFound().build()

        val stats = statisticsService.getConsultantOwnStatistics(consultantId)
            ?: return ResponseEntity.ok(KtiConsultantOwnStatistics(
                totalResponses = 0,
                averageScore = null,
                roundsParticipated = 0,
                currentYearStats = null,
                previousYearStats = null,
                questionAverages = emptyList()
            ))

        return ResponseEntity.ok(KtiConsultantOwnStatistics(
            totalResponses = stats.totalResponses,
            averageScore = stats.averageScore,
            roundsParticipated = stats.roundsParticipated,
            currentYearStats = stats.currentYearStats?.let { data ->
                KtiConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            previousYearStats = stats.previousYearStats?.let { data ->
                KtiConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            questionAverages = stats.questionAverages.map { qa ->
                KtiQuestionAverage(
                    questionId = qa.questionId,
                    questionCode = qa.questionCode,
                    questionText = qa.questionText,
                    category = qa.category,
                    averageScore = qa.averageScore,
                    responseCount = qa.responseCount
                )
            }
        ))
    }

    override fun getKtiMyTrends(): ResponseEntity<KtiConsultantYearlyStats> {
        val currentUser = authenticationHelper.getCurrentUser()
            ?: return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build()
        val consultantId = currentUser.id ?: return ResponseEntity.notFound().build()

        val trend = statisticsService.getConsultantOwnTrend(consultantId)
            ?: return ResponseEntity.ok(KtiConsultantYearlyStats(
                consultantId = consultantId,
                consultantName = currentUser.name ?: "Ukjent",
                email = currentUser.email ?: "",
                yearlyData = emptyMap()
            ))

        return ResponseEntity.ok(KtiConsultantYearlyStats(
            consultantId = trend.consultantId,
            consultantName = trend.consultantName,
            email = trend.email,
            yearlyData = trend.yearlyData.mapKeys { it.key.toString() }.mapValues { (_, data) ->
                KtiConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            }
        ))
    }

    override fun getKtiMyResponses(roundId: Long?): ResponseEntity<List<KtiResponseSummary>> {
        val currentUser = authenticationHelper.getCurrentUser()
            ?: return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build()
        val consultantId = currentUser.id ?: return ResponseEntity.notFound().build()

        val responses = statisticsService.getConsultantOwnResponses(consultantId, roundId)

        return ResponseEntity.ok(responses.map { response ->
            KtiResponseSummary(
                id = response.id,
                consultantId = response.consultantId,
                consultantName = response.consultantName,
                organizationId = response.organizationId,
                organizationName = response.organizationName,
                contactId = response.contactId,
                contactName = response.contactName,
                contactEmail = response.contactEmail,
                averageScore = response.averageScore,
                respondedAt = response.respondedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
                questionResponses = response.questionResponses.map { qr ->
                    KtiQuestionResponse(
                        id = qr.id,
                        questionId = qr.questionId,
                        questionCode = qr.questionCode,
                        questionText = qr.questionText,
                        questionType = KtiQuestionType.valueOf(qr.questionType.name),
                        ratingValue = qr.ratingValue,
                        textValue = qr.textValue
                    )
                }
            )
        })
    }

    // === Response and Invitation Admin Operations ===

    @RequiresAdmin
    override fun updateKtiResponse(responseId: Long, updateKtiResponse: UpdateKtiResponse): ResponseEntity<KtiQuestionResponse> {
        val response = responseRepository.findById(responseId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        // Update only provided fields
        val updatedResponse = response.copy(
            ratingValue = updateKtiResponse.ratingValue ?: response.ratingValue,
            textValue = updateKtiResponse.textValue ?: response.textValue
        )
        val saved = responseRepository.save(updatedResponse)
        return ResponseEntity.ok(toQuestionResponseModel(saved))
    }

    @RequiresAdmin
    override fun deleteKtiResponse(responseId: Long): ResponseEntity<Unit> {
        val response = responseRepository.findById(responseId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        responseRepository.delete(response)
        return ResponseEntity.noContent().build()
    }

    @RequiresAdmin
    override fun updateKtiInvitation(invitationId: Long, updateKtiInvitation: UpdateKtiInvitation): ResponseEntity<KtiInvitation> {
        val invitation = invitationRepository.findById(invitationId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        // Update only provided fields
        val updatedInvitation = invitation.copy(
            status = updateKtiInvitation.status?.let { toEntityInvitationStatus(it) } ?: invitation.status,
            sentAt = updateKtiInvitation.sentAt?.toLocalDateTime() ?: invitation.sentAt,
            openedAt = updateKtiInvitation.openedAt?.toLocalDateTime() ?: invitation.openedAt,
            respondedAt = updateKtiInvitation.respondedAt?.toLocalDateTime() ?: invitation.respondedAt
        )
        val saved = invitationRepository.save(updatedInvitation)
        return ResponseEntity.ok(toInvitationModel(saved))
    }

    @RequiresAdmin
    override fun deleteKtiInvitation(invitationId: Long): ResponseEntity<Unit> {
        val invitation = invitationRepository.findById(invitationId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        // Delete all responses for this invitation first
        val responses = responseRepository.findByInvitationId(invitationId)
        responseRepository.deleteAll(responses)

        // Then delete the invitation
        invitationRepository.delete(invitation)
        return ResponseEntity.noContent().build()
    }

    // === Admin endpoints for viewing any consultant's KTI data ===

    @RequiresAdmin
    override fun getKtiConsultantStatisticsAdmin(consultantId: Long): ResponseEntity<KtiConsultantOwnStatistics> {
        val user = userRepository.findById(consultantId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        val stats = statisticsService.getConsultantOwnStatistics(consultantId)
            ?: return ResponseEntity.ok(KtiConsultantOwnStatistics(
                totalResponses = 0,
                averageScore = null,
                roundsParticipated = 0,
                currentYearStats = null,
                previousYearStats = null,
                questionAverages = emptyList()
            ))

        return ResponseEntity.ok(KtiConsultantOwnStatistics(
            totalResponses = stats.totalResponses,
            averageScore = stats.averageScore,
            roundsParticipated = stats.roundsParticipated,
            currentYearStats = stats.currentYearStats?.let { data ->
                KtiConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            previousYearStats = stats.previousYearStats?.let { data ->
                KtiConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            questionAverages = stats.questionAverages.map { qa ->
                KtiQuestionAverage(
                    questionId = qa.questionId,
                    questionCode = qa.questionCode,
                    questionText = qa.questionText,
                    category = qa.category,
                    averageScore = qa.averageScore,
                    responseCount = qa.responseCount
                )
            }
        ))
    }

    @RequiresAdmin
    override fun getKtiConsultantTrendsAdmin(consultantId: Long): ResponseEntity<KtiConsultantYearlyStats> {
        val user = userRepository.findById(consultantId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        val trend = statisticsService.getConsultantOwnTrend(consultantId)
            ?: return ResponseEntity.ok(KtiConsultantYearlyStats(
                consultantId = consultantId,
                consultantName = user.name ?: "Ukjent",
                email = user.email ?: "",
                yearlyData = emptyMap()
            ))

        return ResponseEntity.ok(KtiConsultantYearlyStats(
            consultantId = trend.consultantId,
            consultantName = trend.consultantName,
            email = trend.email,
            yearlyData = trend.yearlyData.mapKeys { it.key.toString() }.mapValues { (_, data) ->
                KtiConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            }
        ))
    }

    @RequiresAdmin
    override fun getKtiConsultantResponsesAdmin(consultantId: Long, roundId: Long?): ResponseEntity<List<KtiResponseSummary>> {
        val user = userRepository.findById(consultantId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        val responses = statisticsService.getConsultantOwnResponses(consultantId, roundId)

        return ResponseEntity.ok(responses.map { response ->
            KtiResponseSummary(
                id = response.id,
                consultantId = response.consultantId,
                consultantName = response.consultantName,
                organizationId = response.organizationId,
                organizationName = response.organizationName,
                contactId = response.contactId,
                contactName = response.contactName,
                contactEmail = response.contactEmail,
                averageScore = response.averageScore,
                respondedAt = response.respondedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
                questionResponses = response.questionResponses.map { qr ->
                    KtiQuestionResponse(
                        id = qr.id,
                        questionId = qr.questionId,
                        questionCode = qr.questionCode,
                        questionText = qr.questionText,
                        questionType = KtiQuestionType.valueOf(qr.questionType.name),
                        ratingValue = qr.ratingValue,
                        textValue = qr.textValue
                    )
                }
            )
        })
    }

    // === Mappers ===

    private fun toQuestionResponseModel(entity: KtiResponseEntity): KtiQuestionResponse {
        return KtiQuestionResponse(
            id = entity.id!!,
            questionId = entity.question.id!!,
            questionCode = entity.question.code,
            questionText = entity.question.textNo,
            questionType = KtiQuestionType.valueOf(entity.question.questionType.name),
            ratingValue = entity.ratingValue,
            textValue = entity.textValue
        )
    }

    private fun toRoundModel(entity: KtiRoundEntity): KtiRound {
        return KtiRound(
            id = entity.id!!,
            name = entity.name,
            year = entity.year,
            status = toModelStatus(entity.status),
            openDate = entity.openDate,
            closeDate = entity.closeDate,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            updatedAt = entity.updatedAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toOrganizationModel(entity: KtiOrganizationEntity): KtiCustomerOrganization {
        return KtiCustomerOrganization(
            id = entity.id!!,
            name = entity.name,
            organizationNumber = entity.organizationNumber,
            active = entity.active,
            contactCount = entity.contacts.size,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            updatedAt = entity.updatedAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toContactModel(entity: KtiContactEntity): KtiCustomerContact {
        return KtiCustomerContact(
            id = entity.id!!,
            name = entity.name,
            email = entity.email,
            phone = entity.phone,
            title = entity.title,
            organizationId = entity.organization.id!!,
            organizationName = entity.organization.name,
            active = entity.active,
            optedOut = entity.optedOut,
            optedOutAt = entity.optedOutAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            updatedAt = entity.updatedAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toQuestionModel(entity: KtiQuestionEntity): KtiQuestion {
        return KtiQuestion(
            id = entity.id!!,
            code = entity.code,
            textNo = entity.textNo,
            textEn = entity.textEn,
            questionType = KtiQuestionType.valueOf(entity.questionType.name),
            category = entity.category,
            displayOrder = entity.displayOrder,
            active = entity.active,
            required = entity.required
        )
    }

    private fun toEntityQuestionType(model: KtiQuestionType): KtiQuestionTypeEntity {
        return KtiQuestionTypeEntity.valueOf(model.name)
    }

    private fun toRoundQuestionModel(entity: KtiRoundQuestionEntity): KtiRoundQuestion {
        return KtiRoundQuestion(
            id = entity.id!!,
            roundId = entity.round.id!!,
            question = toQuestionModel(entity.question),
            displayOrder = entity.displayOrder,
            active = entity.active,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toModelStatus(status: KtiRoundStatusEntity): KtiRoundStatus {
        return KtiRoundStatus.valueOf(status.name)
    }

    private fun toEntityStatus(status: KtiRoundStatus): KtiRoundStatusEntity {
        return KtiRoundStatusEntity.valueOf(status.name)
    }

    private fun toAssignmentModel(entity: KtiAssignmentEntity): KtiAssignment {
        return KtiAssignment(
            id = entity.id!!,
            roundId = entity.round.id!!,
            consultant = toConsultantModel(entity.consultant),
            contact = toContactModel(entity.contact),
            notes = entity.notes,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            hasInvitation = assignmentService.hasInvitation(entity.id!!)
        )
    }

    private fun toInvitationModel(entity: KtiInvitationEntity): KtiInvitation {
        return KtiInvitation(
            id = entity.id!!,
            assignmentId = entity.assignment.id!!,
            consultant = toConsultantModel(entity.assignment.consultant),
            contact = toContactModel(entity.assignment.contact),
            organization = toOrganizationModel(entity.assignment.contact.organization),
            status = KtiInvitationStatus.valueOf(entity.status.name),
            sentAt = entity.sentAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            openedAt = entity.openedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            respondedAt = entity.respondedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            reminderCount = entity.reminderCount,
            expiresAt = entity.expiresAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toConsultantModel(entity: User): KtiConsultant {
        return KtiConsultant(
            id = entity.id!!,
            name = entity.name ?: "Ukjent",
            email = entity.email
        )
    }

    private fun toEntityInvitationStatus(status: KtiInvitationStatus): KtiInvitationStatusEntity {
        return KtiInvitationStatusEntity.valueOf(status.name)
    }

    private fun toAliasModel(entity: KtiConsultantAliasEntity): ConsultantAlias {
        return ConsultantAlias(
            id = entity.id!!,
            aliasName = entity.aliasName,
            userId = entity.user?.id,
            userName = entity.user?.name,
            ignored = entity.isIgnored(),
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }
}
