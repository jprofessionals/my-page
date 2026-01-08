package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.KtuApiDelegate
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.entity.ktu.KtuAssignment as KtuAssignmentEntity
import no.jpro.mypageapi.entity.ktu.KtuConsultantAlias as KtuConsultantAliasEntity
import no.jpro.mypageapi.entity.ktu.KtuCustomerContact as KtuContactEntity
import no.jpro.mypageapi.entity.ktu.KtuCustomerOrganization as KtuOrganizationEntity
import no.jpro.mypageapi.entity.ktu.KtuInvitation as KtuInvitationEntity
import no.jpro.mypageapi.entity.ktu.KtuInvitationStatus as KtuInvitationStatusEntity
import no.jpro.mypageapi.entity.ktu.KtuQuestion as KtuQuestionEntity
import no.jpro.mypageapi.entity.ktu.KtuQuestionType as KtuQuestionTypeEntity
import no.jpro.mypageapi.entity.ktu.KtuResponse as KtuResponseEntity
import no.jpro.mypageapi.entity.ktu.KtuRound as KtuRoundEntity
import no.jpro.mypageapi.entity.ktu.KtuRoundQuestion as KtuRoundQuestionEntity
import no.jpro.mypageapi.entity.ktu.KtuRoundStatus as KtuRoundStatusEntity
import no.jpro.mypageapi.model.*
import no.jpro.mypageapi.repository.KtuConsultantAliasRepository
import no.jpro.mypageapi.repository.KtuInvitationRepository
import no.jpro.mypageapi.repository.KtuResponseRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.KtuAssignmentService
import no.jpro.mypageapi.service.KtuColorThemeService
import no.jpro.mypageapi.service.KtuContactImportService
import no.jpro.mypageapi.service.KtuLogoService
import no.jpro.mypageapi.service.KtuContactService
import no.jpro.mypageapi.service.KtuImportService
import no.jpro.mypageapi.service.KtuInvitationService
import no.jpro.mypageapi.service.KtuOrganizationService
import no.jpro.mypageapi.service.KtuQuestionService
import no.jpro.mypageapi.service.KtuRoundQuestionService
import no.jpro.mypageapi.service.KtuRoundService
import no.jpro.mypageapi.service.KtuEmailTemplateService
import no.jpro.mypageapi.service.KtuStatisticsService
import no.jpro.mypageapi.service.UserSyncService
import no.jpro.mypageapi.entity.ktu.KtuColorTheme as KtuColorThemeEntity
import no.jpro.mypageapi.repository.KtuColorThemeRepository
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
class KtuApiDelegateImpl(
    private val roundService: KtuRoundService,
    private val organizationService: KtuOrganizationService,
    private val contactService: KtuContactService,
    private val questionService: KtuQuestionService,
    private val roundQuestionService: KtuRoundQuestionService,
    private val assignmentService: KtuAssignmentService,
    private val invitationService: KtuInvitationService,
    private val importService: KtuImportService,
    private val contactImportService: KtuContactImportService,
    private val statisticsService: KtuStatisticsService,
    private val userSyncService: UserSyncService,
    private val userRepository: UserRepository,
    private val consultantAliasRepository: KtuConsultantAliasRepository,
    private val responseRepository: KtuResponseRepository,
    private val invitationRepository: KtuInvitationRepository,
    private val emailTemplateService: KtuEmailTemplateService,
    private val colorThemeService: KtuColorThemeService,
    private val logoService: KtuLogoService,
    private val authenticationHelper: AuthenticationHelper,
    private val request: Optional<NativeWebRequest>,
    @Value("\${app.base-url:http://localhost:3000}") private val baseUrl: String
) : KtuApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    // === Rounds ===

    override fun getKtuRounds(status: KtuRoundStatus?): ResponseEntity<List<KtuRound>> {
        val rounds = if (status != null) {
            roundService.getRoundsByStatus(toEntityStatus(status))
        } else {
            roundService.getAllRounds()
        }
        return ResponseEntity.ok(rounds.map { toRoundModel(it) })
    }

    override fun getKtuRound(roundId: Long): ResponseEntity<KtuRound> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toRoundModel(round))
    }

    @RequiresAdmin
    override fun createKtuRound(createKtuRound: CreateKtuRound): ResponseEntity<KtuRound> {
        val currentUser = authenticationHelper.getCurrentUser()
        return try {
            val round = roundService.createRound(
                name = createKtuRound.name,
                year = createKtuRound.year,
                openDate = createKtuRound.openDate,
                closeDate = createKtuRound.closeDate,
                createdBy = currentUser
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toRoundModel(round))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtuRound(roundId: Long, updateKtuRound: UpdateKtuRound): ResponseEntity<KtuRound> {
        return try {
            val round = roundService.updateRound(
                id = roundId,
                name = updateKtuRound.name,
                openDate = updateKtuRound.openDate,
                closeDate = updateKtuRound.closeDate,
                status = updateKtuRound.status?.let { toEntityStatus(it) },
                // Appearance fields
                colorThemeId = updateKtuRound.colorThemeId,
                introText = updateKtuRound.introText,
                instructionText = updateKtuRound.instructionText,
                ratingLabelLow = updateKtuRound.ratingLabelLow,
                ratingLabelHigh = updateKtuRound.ratingLabelHigh,
                thankYouTitle = updateKtuRound.thankYouTitle,
                thankYouMessage = updateKtuRound.thankYouMessage,
                commentFieldLabel = updateKtuRound.commentFieldLabel,
                // Import statistics
                manualSentCount = updateKtuRound.manualSentCount
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toRoundModel(round))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun deleteKtuRound(roundId: Long): ResponseEntity<Unit> {
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

    // === Color Themes ===

    override fun getKtuColorThemes(): ResponseEntity<List<KtuColorTheme>> {
        val themes = colorThemeService.getAllThemes()
        return ResponseEntity.ok(themes.map { toColorThemeModel(it) })
    }

    override fun getKtuColorTheme(themeId: Long): ResponseEntity<KtuColorTheme> {
        val theme = colorThemeService.getThemeById(themeId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toColorThemeModel(theme))
    }

    @RequiresAdmin
    override fun createKtuColorTheme(createKtuColorTheme: CreateKtuColorTheme): ResponseEntity<KtuColorTheme> {
        return try {
            val theme = colorThemeService.createTheme(
                name = createKtuColorTheme.name,
                headerBgColor = createKtuColorTheme.headerBgColor,
                primaryColor = createKtuColorTheme.primaryColor,
                accentBgColor = createKtuColorTheme.accentBgColor,
                isDefault = createKtuColorTheme.isDefault ?: false
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toColorThemeModel(theme))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtuColorTheme(themeId: Long, updateKtuColorTheme: UpdateKtuColorTheme): ResponseEntity<KtuColorTheme> {
        return try {
            val theme = colorThemeService.updateTheme(
                id = themeId,
                name = updateKtuColorTheme.name,
                headerBgColor = updateKtuColorTheme.headerBgColor,
                primaryColor = updateKtuColorTheme.primaryColor,
                accentBgColor = updateKtuColorTheme.accentBgColor,
                isDefault = updateKtuColorTheme.isDefault
            )
            ResponseEntity.ok(toColorThemeModel(theme))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun deleteKtuColorTheme(themeId: Long): ResponseEntity<Unit> {
        return try {
            colorThemeService.deleteTheme(themeId)
            ResponseEntity.noContent().build()
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Logo ===

    @RequiresAdmin
    override fun uploadKtuRoundLogo(roundId: Long, file: MultipartFile): ResponseEntity<KtuRound> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()

        // Only allow logo upload in DRAFT status
        if (round.status != KtuRoundStatusEntity.DRAFT) {
            return ResponseEntity.badRequest().build()
        }

        // Validate file
        val filename = file.originalFilename ?: return ResponseEntity.badRequest().build()
        val extension = filename.substringAfterLast('.', "").lowercase()
        if (extension !in KtuLogoService.ALLOWED_EXTENSIONS) {
            return ResponseEntity.badRequest().build()
        }
        if (file.size > KtuLogoService.MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest().build()
        }

        return try {
            // Upload the logo
            val logoUrl = logoService.uploadLogo(roundId, filename, file.resource)

            // Update the round with the new logo URL
            val updatedRound = roundService.updateRound(
                id = roundId,
                name = null,
                openDate = null,
                closeDate = null,
                status = null,
                logoUrl = logoUrl
            ) ?: return ResponseEntity.notFound().build()

            ResponseEntity.ok(toRoundModel(updatedRound))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }

    @RequiresAdmin
    override fun deleteKtuRoundLogo(roundId: Long): ResponseEntity<KtuRound> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()

        // Only allow logo deletion in DRAFT status
        if (round.status != KtuRoundStatusEntity.DRAFT) {
            return ResponseEntity.badRequest().build()
        }

        return try {
            // Extract filename from URL if it exists
            val logoUrl = round.logoUrl
            if (logoUrl != null) {
                val filename = logoUrl.substringAfterLast('/')
                logoService.deleteLogo(roundId, filename)
            }

            // Update the round to clear the logo URL
            val updatedRound = roundService.updateRound(
                id = roundId,
                name = null,
                openDate = null,
                closeDate = null,
                status = null,
                clearLogoUrl = true
            ) ?: return ResponseEntity.notFound().build()

            ResponseEntity.ok(toRoundModel(updatedRound))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }

    // === Organizations ===

    override fun getKtuOrganizations(activeOnly: Boolean): ResponseEntity<List<KtuCustomerOrganization>> {
        val organizations = if (activeOnly) {
            organizationService.getActiveOrganizations()
        } else {
            organizationService.getAllOrganizations()
        }
        return ResponseEntity.ok(organizations.map { toOrganizationModel(it) })
    }

    override fun getKtuOrganization(organizationId: Long): ResponseEntity<KtuCustomerOrganization> {
        val organization = organizationService.getOrganization(organizationId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toOrganizationModel(organization))
    }

    @RequiresAdmin
    override fun createKtuOrganization(createKtuOrganization: CreateKtuOrganization): ResponseEntity<KtuCustomerOrganization> {
        return try {
            val organization = organizationService.createOrganization(
                name = createKtuOrganization.name,
                organizationNumber = createKtuOrganization.organizationNumber
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toOrganizationModel(organization))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtuOrganization(
        organizationId: Long,
        updateKtuOrganization: UpdateKtuOrganization
    ): ResponseEntity<KtuCustomerOrganization> {
        return try {
            val organization = organizationService.updateOrganization(
                id = organizationId,
                name = updateKtuOrganization.name,
                organizationNumber = updateKtuOrganization.organizationNumber,
                active = updateKtuOrganization.active
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toOrganizationModel(organization))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Contacts ===

    override fun getKtuContacts(organizationId: Long?, activeOnly: Boolean): ResponseEntity<List<KtuCustomerContact>> {
        val contacts = if (organizationId != null) {
            contactService.getContactsByOrganization(organizationId, activeOnly)
        } else if (activeOnly) {
            contactService.getActiveContacts()
        } else {
            contactService.getAllContacts()
        }
        return ResponseEntity.ok(contacts.map { toContactModel(it) })
    }

    override fun getKtuContact(contactId: Long): ResponseEntity<KtuCustomerContact> {
        val contact = contactService.getContact(contactId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toContactModel(contact))
    }

    @RequiresAdmin
    override fun createKtuContact(createKtuContact: CreateKtuContact): ResponseEntity<KtuCustomerContact> {
        return try {
            val contact = contactService.createContact(
                name = createKtuContact.name,
                email = createKtuContact.email,
                phone = createKtuContact.phone,
                title = createKtuContact.title,
                organizationId = createKtuContact.organizationId
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toContactModel(contact))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtuContact(
        contactId: Long,
        updateKtuContact: UpdateKtuContact
    ): ResponseEntity<KtuCustomerContact> {
        return try {
            val contact = contactService.updateContact(
                id = contactId,
                name = updateKtuContact.name,
                email = updateKtuContact.email,
                phone = updateKtuContact.phone,
                title = updateKtuContact.title,
                organizationId = updateKtuContact.organizationId,
                active = updateKtuContact.active,
                optedOut = updateKtuContact.optedOut
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toContactModel(contact))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Questions ===

    override fun getKtuQuestions(activeOnly: Boolean): ResponseEntity<List<KtuQuestion>> {
        val questions = if (activeOnly) {
            questionService.getActiveQuestions()
        } else {
            questionService.getAllQuestions()
        }
        return ResponseEntity.ok(questions.map { toQuestionModel(it) })
    }

    @RequiresAdmin
    override fun createKtuQuestion(createKtuQuestion: CreateKtuQuestion): ResponseEntity<KtuQuestion> {
        return try {
            val question = questionService.createQuestion(
                code = createKtuQuestion.code,
                textNo = createKtuQuestion.textNo,
                textEn = createKtuQuestion.textEn,
                questionType = toEntityQuestionType(createKtuQuestion.questionType),
                category = createKtuQuestion.category,
                displayOrder = createKtuQuestion.displayOrder,
                required = createKtuQuestion.required ?: true
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toQuestionModel(question))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtuQuestion(questionId: Long, updateKtuQuestion: UpdateKtuQuestion): ResponseEntity<KtuQuestion> {
        return try {
            val question = questionService.updateQuestion(
                id = questionId,
                code = updateKtuQuestion.code,
                textNo = updateKtuQuestion.textNo,
                textEn = updateKtuQuestion.textEn,
                questionType = updateKtuQuestion.questionType?.let { toEntityQuestionType(it) },
                category = updateKtuQuestion.category,
                displayOrder = updateKtuQuestion.displayOrder,
                active = updateKtuQuestion.active,
                required = updateKtuQuestion.required
            ) ?: return ResponseEntity.notFound().build()
            ResponseEntity.ok(toQuestionModel(question))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    // === Round Questions ===

    override fun getKtuRoundQuestions(roundId: Long, activeOnly: Boolean): ResponseEntity<List<KtuRoundQuestion>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val roundQuestions = roundQuestionService.getQuestionsForRound(roundId, activeOnly)
        return ResponseEntity.ok(roundQuestions.map { toRoundQuestionModel(it) })
    }

    @RequiresAdmin
    override fun addKtuRoundQuestion(roundId: Long, addKtuRoundQuestion: AddKtuRoundQuestion): ResponseEntity<KtuRoundQuestion> {
        return try {
            val roundQuestion = roundQuestionService.addQuestionToRound(
                roundId = roundId,
                questionId = addKtuRoundQuestion.questionId,
                displayOrder = addKtuRoundQuestion.displayOrder,
                active = addKtuRoundQuestion.active ?: true
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toRoundQuestionModel(roundQuestion))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun updateKtuRoundQuestion(
        roundId: Long,
        questionId: Long,
        updateKtuRoundQuestion: UpdateKtuRoundQuestion
    ): ResponseEntity<KtuRoundQuestion> {
        val roundQuestion = roundQuestionService.updateRoundQuestion(
            roundId = roundId,
            questionId = questionId,
            displayOrder = updateKtuRoundQuestion.displayOrder,
            active = updateKtuRoundQuestion.active,
            commentFieldLabel = updateKtuRoundQuestion.commentFieldLabel,
            customTextNo = updateKtuRoundQuestion.customTextNo,
            requiredOverride = updateKtuRoundQuestion.requiredOverride
        ) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toRoundQuestionModel(roundQuestion))
    }

    @RequiresAdmin
    override fun removeKtuRoundQuestion(roundId: Long, questionId: Long): ResponseEntity<Unit> {
        return if (roundQuestionService.removeQuestionFromRound(roundId, questionId)) {
            ResponseEntity.noContent().build()
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @RequiresAdmin
    override fun copyKtuRoundQuestions(roundId: Long, sourceRoundId: Long): ResponseEntity<List<KtuRoundQuestion>> {
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
    override fun initKtuRoundQuestionsFromTemplate(roundId: Long): ResponseEntity<List<KtuRoundQuestion>> {
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
    override fun previewKtuCsv(file: MultipartFile): ResponseEntity<KtuCsvPreview> {
        return try {
            val preview = importService.previewCsv(file)
            ResponseEntity.ok(KtuCsvPreview(
                columns = preview.columns,
                sampleRows = preview.sampleRows,
                totalRows = preview.totalRows,
                delimiter = preview.delimiter,
                requiredFields = preview.requiredFields.map { field ->
                    KtuImportField(
                        key = field.key,
                        label = field.label,
                        required = field.required,
                        type = KtuImportField.Type.valueOf(field.type.name)
                    )
                }
            ))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun importHistoricalKtu(
        file: MultipartFile,
        dryRun: Boolean,
        skipUnmatchedConsultants: Boolean,
        columnMapping: String?
    ): ResponseEntity<KtuImportResult> {
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

    private fun toImportResultModel(result: no.jpro.mypageapi.service.ImportResult): KtuImportResult {
        return KtuImportResult(
            valid = result.valid,
            dryRun = result.dryRun,
            totalRows = result.totalRows,
            validRows = result.validRows,
            importedResponses = result.importedResponses,
            skippedRows = result.skippedRows,
            errors = result.errors.map { error ->
                KtuImportError(
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
    override fun previewContactsCsv(file: MultipartFile): ResponseEntity<KtuContactsCsvPreview> {
        return try {
            val preview = contactImportService.previewCsv(file)
            ResponseEntity.ok(KtuContactsCsvPreview(
                columns = preview.columns,
                sampleRows = preview.sampleRows,
                totalRows = preview.totalRows,
                delimiter = preview.delimiter,
                requiredFields = preview.requiredFields.map { field ->
                    KtuImportField(
                        key = field.key,
                        label = field.label,
                        required = field.required,
                        type = KtuImportField.Type.TEXT
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
    ): ResponseEntity<KtuContactsImportResult> {
        return try {
            val result = contactImportService.importContacts(
                file = file,
                dryRun = dryRun,
                columnMappingJson = columnMapping,
                year = year
            )
            ResponseEntity.ok(KtuContactsImportResult(
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
                    KtuImportError(
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
    override fun getKtuAssignments(roundId: Long): ResponseEntity<List<KtuAssignment>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val assignments = assignmentService.getAssignmentsByRound(roundId)
        return ResponseEntity.ok(assignments.map { toAssignmentModel(it) })
    }

    @RequiresAdmin
    override fun getKtuAssignment(roundId: Long, assignmentId: Long): ResponseEntity<KtuAssignment> {
        val assignment = assignmentService.getAssignment(assignmentId)
            ?: return ResponseEntity.notFound().build()
        if (assignment.round.id != roundId) {
            return ResponseEntity.notFound().build()
        }
        return ResponseEntity.ok(toAssignmentModel(assignment))
    }

    @RequiresAdmin
    override fun createKtuAssignment(roundId: Long, createKtuAssignment: CreateKtuAssignment): ResponseEntity<KtuAssignment> {
        return try {
            val currentUser = authenticationHelper.getCurrentUser()
            val assignment = assignmentService.createAssignment(
                roundId = roundId,
                consultantId = createKtuAssignment.consultantId,
                contactId = createKtuAssignment.contactId,
                notes = createKtuAssignment.notes,
                createdBy = currentUser
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toAssignmentModel(assignment))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    @RequiresAdmin
    override fun deleteKtuAssignment(roundId: Long, assignmentId: Long): ResponseEntity<Unit> {
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
    override fun getKtuInvitations(roundId: Long, status: KtuInvitationStatus?): ResponseEntity<List<KtuInvitation>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val invitations = if (status != null) {
            invitationService.getInvitationsByRoundAndStatus(roundId, toEntityInvitationStatus(status))
        } else {
            invitationService.getInvitationsByRound(roundId)
        }
        return ResponseEntity.ok(invitations.map { toInvitationModel(it) })
    }

    @RequiresAdmin
    override fun sendKtuInvitations(roundId: Long): ResponseEntity<KtuSendInvitationsResult> {
        return try {
            val result = invitationService.sendInvitations(roundId, baseUrl)
            ResponseEntity.ok(KtuSendInvitationsResult(
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
    override fun sendKtuReminders(roundId: Long): ResponseEntity<KtuSendRemindersResult> {
        return try {
            val result = invitationService.sendReminders(roundId, baseUrl)
            ResponseEntity.ok(KtuSendRemindersResult(
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
    override fun previewKtuEmail(roundId: Long, type: String): ResponseEntity<KtuEmailPreview> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()

        // Create a mock invitation for preview purposes
        val mockInvitation = createMockInvitation(round)
        val surveyUrl = "$baseUrl/ktu/survey/PREVIEW_TOKEN"

        val (subject, html) = when (type) {
            "invitation" -> {
                val html = emailTemplateService.renderInvitation(mockInvitation, surveyUrl)
                "Kundetilfredshetsundersøkelse - Ola Nordmann" to html
            }
            "reminder" -> {
                val html = emailTemplateService.renderReminder(mockInvitation, surveyUrl, 1)
                "Påminnelse: Kundetilfredshetsundersøkelse - Ola Nordmann" to html
            }
            else -> return ResponseEntity.badRequest().build()
        }

        return ResponseEntity.ok(KtuEmailPreview(
            subject = subject,
            html = html,
            type = KtuEmailPreview.Type.valueOf(type.uppercase())
        ))
    }

    // === Test Survey ===

    @RequiresAdmin
    override fun createKtuTestSurvey(roundId: Long, createKtuTestSurvey: CreateKtuTestSurvey): ResponseEntity<KtuTestSurveyResult> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()

        // Only allow test surveys for DRAFT or OPEN rounds
        if (round.status !in listOf(KtuRoundStatusEntity.DRAFT, KtuRoundStatusEntity.OPEN)) {
            return ResponseEntity.badRequest().build()
        }

        return try {
            val result = invitationService.createTestSurvey(
                round = round,
                email = createKtuTestSurvey.email,
                consultantName = createKtuTestSurvey.consultantName ?: "Test Konsulent",
                contactName = createKtuTestSurvey.contactName ?: "Test Kontakt",
                organizationName = createKtuTestSurvey.organizationName ?: "Test Kunde AS",
                baseUrl = baseUrl
            )

            ResponseEntity.ok(KtuTestSurveyResult(
                surveyUrl = result.surveyUrl,
                token = result.token,
                emailSent = result.emailSent,
                emailSentTo = result.emailSentTo,
                expiresAt = result.expiresAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime()
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }

    /**
     * Create a mock invitation with sample data for email preview.
     */
    private fun createMockInvitation(round: KtuRoundEntity): KtuInvitationEntity {
        val mockOrganization = KtuOrganizationEntity(
            id = 0,
            name = "Eksempel AS"
        )

        val mockContact = KtuContactEntity(
            id = 0,
            name = "Kari Kunde",
            email = "kari.kunde@eksempel.no",
            organization = mockOrganization
        )

        val mockConsultant = User(
            id = 0,
            name = "Ola Nordmann",
            givenName = "Ola",
            familyName = "Nordmann",
            email = "ola.nordmann@jpro.no",
            sub = "mock-sub",
            budgets = emptyList()
        )

        val mockAssignment = KtuAssignmentEntity(
            id = 0,
            round = round,
            consultant = mockConsultant,
            contact = mockContact
        )

        return KtuInvitationEntity(
            id = 0,
            assignment = mockAssignment,
            token = "PREVIEW_TOKEN"
        )
    }

    // === Consultants ===

    @RequiresAdmin
    override fun getKtuConsultants(): ResponseEntity<List<KtuConsultant>> {
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

        val alias = consultantAliasRepository.save(KtuConsultantAliasEntity(
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

    // === KTU Users ===

    override fun getKtuUsers(): ResponseEntity<List<KtuUser>> {
        val users = userRepository.findByEnabled(true)
        return ResponseEntity.ok(users.map { user ->
            KtuUser(
                id = user.id!!,
                name = user.name ?: "Ukjent",
                email = user.email
            )
        })
    }

    // === Statistics ===

    override fun getKtuRoundStatistics(roundId: Long): ResponseEntity<KtuRoundStatistics> {
        val stats = statisticsService.getRoundStatistics(roundId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(KtuRoundStatistics(
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
                KtuQuestionStatistics(
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

    override fun getKtuRoundResponses(roundId: Long): ResponseEntity<List<KtuResponseSummary>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val responses = statisticsService.getRoundResponses(roundId)
        return ResponseEntity.ok(responses.map { response ->
            KtuResponseSummary(
                id = response.id,
                roundId = response.roundId,
                roundName = response.roundName,
                year = response.year,
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
                    KtuQuestionResponse(
                        id = qr.id,
                        questionId = qr.questionId,
                        questionCode = qr.questionCode,
                        questionText = qr.questionText,
                        questionType = KtuQuestionType.valueOf(qr.questionType.name),
                        ratingValue = qr.ratingValue,
                        textValue = qr.textValue
                    )
                }
            )
        })
    }

    override fun getKtuStatisticsByConsultant(roundId: Long): ResponseEntity<List<KtuConsultantStatistics>> {
        val round = roundService.getRound(roundId) ?: return ResponseEntity.notFound().build()
        val stats = statisticsService.getStatisticsByConsultant(roundId)
        return ResponseEntity.ok(stats.map { s ->
            KtuConsultantStatistics(
                consultantId = s.consultantId,
                consultantName = s.consultantName,
                responseCount = s.responseCount,
                averageScore = s.averageScore,
                organizationCount = s.organizationCount,
                scoreDistribution = s.scoreDistribution.mapKeys { it.key.toString() }
            )
        })
    }

    override fun getKtuCompanyTrends(): ResponseEntity<KtuCompanyTrendStatistics> {
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

    override fun getKtuConsultantsTrends(): ResponseEntity<List<KtuConsultantYearlyStats>> {
        val trends = statisticsService.getConsultantsTrendStatistics()
        return ResponseEntity.ok(trends.map { cs ->
            KtuConsultantYearlyStats(
                consultantId = cs.consultantId,
                consultantName = cs.consultantName,
                email = cs.email,
                yearlyData = cs.yearlyData.mapKeys { it.key.toString() }.mapValues { (_, data) ->
                    KtuConsultantYearData(
                        responseCount = data.responseCount,
                        averageScore = data.averageScore,
                        organizationCount = data.organizationCount
                    )
                }
            )
        })
    }

    // === My KTU (Consultant's own data) ===

    override fun getKtuMyStatistics(): ResponseEntity<KtuConsultantOwnStatistics> {
        val currentUser = authenticationHelper.getCurrentUser()
            ?: return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build()
        val consultantId = currentUser.id ?: return ResponseEntity.notFound().build()

        val stats = statisticsService.getConsultantOwnStatistics(consultantId)
            ?: return ResponseEntity.ok(KtuConsultantOwnStatistics(
                totalResponses = 0,
                averageScore = null,
                roundsParticipated = 0,
                currentYearStats = null,
                previousYearStats = null,
                questionAverages = emptyList()
            ))

        return ResponseEntity.ok(KtuConsultantOwnStatistics(
            totalResponses = stats.totalResponses,
            averageScore = stats.averageScore,
            roundsParticipated = stats.roundsParticipated,
            currentYearStats = stats.currentYearStats?.let { data ->
                KtuConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            previousYearStats = stats.previousYearStats?.let { data ->
                KtuConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            questionAverages = stats.questionAverages.map { qa ->
                KtuQuestionAverage(
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

    override fun getKtuMyTrends(): ResponseEntity<KtuConsultantYearlyStats> {
        val currentUser = authenticationHelper.getCurrentUser()
            ?: return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build()
        val consultantId = currentUser.id ?: return ResponseEntity.notFound().build()

        val trend = statisticsService.getConsultantOwnTrend(consultantId)
            ?: return ResponseEntity.ok(KtuConsultantYearlyStats(
                consultantId = consultantId,
                consultantName = currentUser.name ?: "Ukjent",
                email = currentUser.email ?: "",
                yearlyData = emptyMap()
            ))

        return ResponseEntity.ok(KtuConsultantYearlyStats(
            consultantId = trend.consultantId,
            consultantName = trend.consultantName,
            email = trend.email,
            yearlyData = trend.yearlyData.mapKeys { it.key.toString() }.mapValues { (_, data) ->
                KtuConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            }
        ))
    }

    override fun getKtuMyResponses(roundId: Long?): ResponseEntity<List<KtuResponseSummary>> {
        val currentUser = authenticationHelper.getCurrentUser()
            ?: return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build()
        val consultantId = currentUser.id ?: return ResponseEntity.notFound().build()

        val responses = statisticsService.getConsultantOwnResponses(consultantId, roundId)

        return ResponseEntity.ok(responses.map { response ->
            KtuResponseSummary(
                id = response.id,
                roundId = response.roundId,
                roundName = response.roundName,
                year = response.year,
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
                    KtuQuestionResponse(
                        id = qr.id,
                        questionId = qr.questionId,
                        questionCode = qr.questionCode,
                        questionText = qr.questionText,
                        questionType = KtuQuestionType.valueOf(qr.questionType.name),
                        ratingValue = qr.ratingValue,
                        textValue = qr.textValue
                    )
                }
            )
        })
    }

    // === Response and Invitation Admin Operations ===

    @RequiresAdmin
    override fun updateKtuResponse(responseId: Long, updateKtuResponse: UpdateKtuResponse): ResponseEntity<KtuQuestionResponse> {
        val response = responseRepository.findById(responseId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        // Update only provided fields
        val updatedResponse = response.copy(
            ratingValue = updateKtuResponse.ratingValue ?: response.ratingValue,
            textValue = updateKtuResponse.textValue ?: response.textValue
        )
        val saved = responseRepository.save(updatedResponse)
        return ResponseEntity.ok(toQuestionResponseModel(saved))
    }

    @RequiresAdmin
    override fun deleteKtuResponse(responseId: Long): ResponseEntity<Unit> {
        val response = responseRepository.findById(responseId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        responseRepository.delete(response)
        return ResponseEntity.noContent().build()
    }

    @RequiresAdmin
    override fun updateKtuInvitation(invitationId: Long, updateKtuInvitation: UpdateKtuInvitation): ResponseEntity<KtuInvitation> {
        val invitation = invitationRepository.findById(invitationId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        // Update only provided fields
        val updatedInvitation = invitation.copy(
            status = updateKtuInvitation.status?.let { toEntityInvitationStatus(it) } ?: invitation.status,
            sentAt = updateKtuInvitation.sentAt?.toLocalDateTime() ?: invitation.sentAt,
            openedAt = updateKtuInvitation.openedAt?.toLocalDateTime() ?: invitation.openedAt,
            respondedAt = updateKtuInvitation.respondedAt?.toLocalDateTime() ?: invitation.respondedAt
        )
        val saved = invitationRepository.save(updatedInvitation)
        return ResponseEntity.ok(toInvitationModel(saved))
    }

    @RequiresAdmin
    override fun deleteKtuInvitation(invitationId: Long): ResponseEntity<Unit> {
        val invitation = invitationRepository.findById(invitationId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        // Delete all responses for this invitation first
        val responses = responseRepository.findByInvitationId(invitationId)
        responseRepository.deleteAll(responses)

        // Then delete the invitation
        invitationRepository.delete(invitation)
        return ResponseEntity.noContent().build()
    }

    // === Admin endpoints for viewing any consultant's KTU data ===

    @RequiresAdmin
    override fun getKtuConsultantStatisticsAdmin(consultantId: Long): ResponseEntity<KtuConsultantOwnStatistics> {
        val user = userRepository.findById(consultantId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        val stats = statisticsService.getConsultantOwnStatistics(consultantId)
            ?: return ResponseEntity.ok(KtuConsultantOwnStatistics(
                totalResponses = 0,
                averageScore = null,
                roundsParticipated = 0,
                currentYearStats = null,
                previousYearStats = null,
                questionAverages = emptyList()
            ))

        return ResponseEntity.ok(KtuConsultantOwnStatistics(
            totalResponses = stats.totalResponses,
            averageScore = stats.averageScore,
            roundsParticipated = stats.roundsParticipated,
            currentYearStats = stats.currentYearStats?.let { data ->
                KtuConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            previousYearStats = stats.previousYearStats?.let { data ->
                KtuConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            },
            questionAverages = stats.questionAverages.map { qa ->
                KtuQuestionAverage(
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
    override fun getKtuConsultantTrendsAdmin(consultantId: Long): ResponseEntity<KtuConsultantYearlyStats> {
        val user = userRepository.findById(consultantId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        val trend = statisticsService.getConsultantOwnTrend(consultantId)
            ?: return ResponseEntity.ok(KtuConsultantYearlyStats(
                consultantId = consultantId,
                consultantName = user.name ?: "Ukjent",
                email = user.email ?: "",
                yearlyData = emptyMap()
            ))

        return ResponseEntity.ok(KtuConsultantYearlyStats(
            consultantId = trend.consultantId,
            consultantName = trend.consultantName,
            email = trend.email,
            yearlyData = trend.yearlyData.mapKeys { it.key.toString() }.mapValues { (_, data) ->
                KtuConsultantYearData(
                    responseCount = data.responseCount,
                    averageScore = data.averageScore,
                    organizationCount = data.organizationCount
                )
            }
        ))
    }

    @RequiresAdmin
    override fun getKtuConsultantResponsesAdmin(consultantId: Long, roundId: Long?): ResponseEntity<List<KtuResponseSummary>> {
        val user = userRepository.findById(consultantId).orElse(null)
            ?: return ResponseEntity.notFound().build()

        val responses = statisticsService.getConsultantOwnResponses(consultantId, roundId)

        return ResponseEntity.ok(responses.map { response ->
            KtuResponseSummary(
                id = response.id,
                roundId = response.roundId,
                roundName = response.roundName,
                year = response.year,
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
                    KtuQuestionResponse(
                        id = qr.id,
                        questionId = qr.questionId,
                        questionCode = qr.questionCode,
                        questionText = qr.questionText,
                        questionType = KtuQuestionType.valueOf(qr.questionType.name),
                        ratingValue = qr.ratingValue,
                        textValue = qr.textValue
                    )
                }
            )
        })
    }

    // === Mappers ===

    private fun toQuestionResponseModel(entity: KtuResponseEntity): KtuQuestionResponse {
        return KtuQuestionResponse(
            id = entity.id!!,
            questionId = entity.question.id!!,
            questionCode = entity.question.code,
            questionText = entity.question.textNo,
            questionType = KtuQuestionType.valueOf(entity.question.questionType.name),
            ratingValue = entity.ratingValue,
            textValue = entity.textValue
        )
    }

    private fun toRoundModel(entity: KtuRoundEntity): KtuRound {
        return KtuRound(
            id = entity.id!!,
            name = entity.name,
            year = entity.year,
            status = toModelStatus(entity.status),
            openDate = entity.openDate,
            closeDate = entity.closeDate,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            updatedAt = entity.updatedAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            // Appearance fields
            logoUrl = entity.logoUrl,
            colorTheme = entity.colorTheme?.let { toColorThemeModel(it) },
            introText = entity.introText,
            instructionText = entity.instructionText,
            ratingLabelLow = entity.ratingLabelLow,
            ratingLabelHigh = entity.ratingLabelHigh,
            thankYouTitle = entity.thankYouTitle,
            thankYouMessage = entity.thankYouMessage,
            commentFieldLabel = entity.commentFieldLabel,
            // Import statistics
            manualSentCount = entity.manualSentCount
        )
    }

    private fun toColorThemeModel(entity: KtuColorThemeEntity): KtuColorTheme {
        return KtuColorTheme(
            id = entity.id!!,
            name = entity.name,
            headerBgColor = entity.headerBgColor,
            primaryColor = entity.primaryColor,
            accentBgColor = entity.accentBgColor,
            isDefault = entity.isDefault
        )
    }

    private fun toOrganizationModel(entity: KtuOrganizationEntity): KtuCustomerOrganization {
        return KtuCustomerOrganization(
            id = entity.id!!,
            name = entity.name,
            organizationNumber = entity.organizationNumber,
            active = entity.active,
            contactCount = entity.contacts.size,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            updatedAt = entity.updatedAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toContactModel(entity: KtuContactEntity): KtuCustomerContact {
        return KtuCustomerContact(
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

    private fun toQuestionModel(entity: KtuQuestionEntity): KtuQuestion {
        return KtuQuestion(
            id = entity.id!!,
            code = entity.code,
            textNo = entity.textNo,
            textEn = entity.textEn,
            questionType = KtuQuestionType.valueOf(entity.questionType.name),
            category = entity.category,
            displayOrder = entity.displayOrder,
            active = entity.active,
            required = entity.required
        )
    }

    private fun toEntityQuestionType(model: KtuQuestionType): KtuQuestionTypeEntity {
        return KtuQuestionTypeEntity.valueOf(model.name)
    }

    private fun toRoundQuestionModel(entity: KtuRoundQuestionEntity): KtuRoundQuestion {
        return KtuRoundQuestion(
            id = entity.id!!,
            roundId = entity.round.id!!,
            question = toQuestionModel(entity.question),
            displayOrder = entity.displayOrder,
            active = entity.active,
            commentFieldLabel = entity.commentFieldLabel,
            customTextNo = entity.customTextNo,
            requiredOverride = entity.requiredOverride,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toModelStatus(status: KtuRoundStatusEntity): KtuRoundStatus {
        return KtuRoundStatus.valueOf(status.name)
    }

    private fun toEntityStatus(status: KtuRoundStatus): KtuRoundStatusEntity {
        return KtuRoundStatusEntity.valueOf(status.name)
    }

    private fun toAssignmentModel(entity: KtuAssignmentEntity): KtuAssignment {
        return KtuAssignment(
            id = entity.id!!,
            roundId = entity.round.id!!,
            consultant = toConsultantModel(entity.consultant),
            contact = toContactModel(entity.contact),
            notes = entity.notes,
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime(),
            hasInvitation = assignmentService.hasInvitation(entity.id!!)
        )
    }

    private fun toInvitationModel(entity: KtuInvitationEntity): KtuInvitation {
        return KtuInvitation(
            id = entity.id!!,
            assignmentId = entity.assignment.id!!,
            consultant = toConsultantModel(entity.assignment.consultant),
            contact = toContactModel(entity.assignment.contact),
            organization = toOrganizationModel(entity.assignment.contact.organization),
            status = KtuInvitationStatus.valueOf(entity.status.name),
            sentAt = entity.sentAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            openedAt = entity.openedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            respondedAt = entity.respondedAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            reminderCount = entity.reminderCount,
            expiresAt = entity.expiresAt?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            createdAt = entity.createdAt.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        )
    }

    private fun toConsultantModel(entity: User): KtuConsultant {
        return KtuConsultant(
            id = entity.id!!,
            name = entity.name ?: "Ukjent",
            email = entity.email
        )
    }

    private fun toEntityInvitationStatus(status: KtuInvitationStatus): KtuInvitationStatusEntity {
        return KtuInvitationStatusEntity.valueOf(status.name)
    }

    private fun toAliasModel(entity: KtuConsultantAliasEntity): ConsultantAlias {
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
