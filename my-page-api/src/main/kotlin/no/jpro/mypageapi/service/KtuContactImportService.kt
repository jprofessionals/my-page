package no.jpro.mypageapi.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.entity.ktu.*
import no.jpro.mypageapi.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.BufferedReader
import java.io.InputStreamReader

data class ContactsImportField(
    val key: String,
    val label: String,
    val required: Boolean
)

data class ContactAssignmentInfo(
    val consultantName: String,
    val customerName: String,
    val contactName: String?,
    val email: String?,
    val year: Int
)

data class ContactsCsvPreview(
    val columns: List<String>,
    val sampleRows: List<List<String>>,
    val totalRows: Int,
    val delimiter: String,
    val requiredFields: List<ContactsImportField>
)

data class ContactsColumnMapping(
    val consultant: Int? = null,
    val customer: Int? = null,
    val contactName: Int? = null,
    val email: Int? = null,
    val previousEmail: Int? = null,
    val canSendSurvey: Int? = null,
    val year: Int? = null,
    val sentDate: Int? = null
)

data class ContactsImportResult(
    val valid: Boolean,
    val dryRun: Boolean,
    val totalRows: Int,
    val validRows: Int,
    val skippedRows: Int,
    val createdOrganizations: Int,
    val createdContacts: Int,
    val updatedContacts: Int,
    val createdAssignments: Int,
    val errors: List<ImportError>,
    val unmatchedConsultants: List<UnmatchedConsultant>
)

data class ParsedContactRow(
    val rowNumber: Int,
    val consultantName: String,
    val customerName: String,
    val contactName: String?,
    val email: String?,
    val previousEmail: String?,
    val canSendSurvey: Boolean,
    val year: Int?,
    val sentDate: java.time.LocalDate?
)

@Service
class KtuContactImportService(
    private val organizationRepository: KtuOrganizationRepository,
    private val contactRepository: KtuContactRepository,
    private val userRepository: UserRepository,
    private val consultantAliasRepository: KtuConsultantAliasRepository,
    private val roundRepository: KtuRoundRepository,
    private val assignmentRepository: KtuAssignmentRepository,
    private val invitationRepository: KtuInvitationRepository
) {
    private val logger = LoggerFactory.getLogger(KtuContactImportService::class.java)

    companion object {
        val REQUIRED_FIELDS = listOf(
            ContactsImportField("consultant", "Konsulent", true),
            ContactsImportField("customer", "Kunde/Organisasjon", true),
            ContactsImportField("contactName", "Kontaktperson (navn)", false),
            ContactsImportField("email", "E-post", false),
            ContactsImportField("previousEmail", "E-post (forrige)", false),
            ContactsImportField("canSendSurvey", "Kan sende undersøkelse?", false),
            ContactsImportField("sentDate", "Sendt dato", false)
        )

        private val objectMapper = jacksonObjectMapper()
    }

    fun previewCsv(file: MultipartFile): ContactsCsvPreview {
        val lines = mutableListOf<String>()
        var totalDataRows = 0
        var isHeader = true

        BufferedReader(InputStreamReader(file.inputStream, Charsets.UTF_8)).use { reader ->
            reader.forEachLine { line ->
                if (isHeader) {
                    lines.add(line)
                    isHeader = false
                } else {
                    val trimmed = line.trim()
                    if (trimmed.isNotEmpty() && !trimmed.all { it == ',' || it == ';' || it == '"' || it == '\t' }) {
                        totalDataRows++
                        if (lines.size < 4) {
                            lines.add(line)
                        }
                    }
                }
            }
        }

        if (lines.isEmpty()) {
            throw IllegalArgumentException("CSV-filen er tom")
        }

        val firstLine = lines[0]
        val tabCount = firstLine.count { it == '\t' }
        val semiCount = firstLine.count { it == ';' }
        val commaCount = firstLine.count { it == ',' }
        val delimiter = when {
            tabCount > semiCount && tabCount > commaCount -> "\t"
            semiCount > commaCount -> ";"
            else -> ","
        }

        val columns = firstLine.split(delimiter).map { it.trim().removeSurrounding("\"") }
        val sampleRows = lines.drop(1).map { line ->
            line.split(delimiter).map { it.trim().removeSurrounding("\"") }
        }

        return ContactsCsvPreview(
            columns = columns,
            sampleRows = sampleRows,
            totalRows = totalDataRows,
            delimiter = if (delimiter == "\t") "TAB" else delimiter,
            requiredFields = REQUIRED_FIELDS
        )
    }

    fun parseColumnMapping(mappingJson: String?): ContactsColumnMapping {
        if (mappingJson.isNullOrBlank()) {
            throw IllegalArgumentException("Kolonne-mapping mangler")
        }
        return try {
            objectMapper.readValue(mappingJson)
        } catch (e: Exception) {
            throw IllegalArgumentException("Ugyldig kolonne-mapping format: ${e.message}")
        }
    }

    @Transactional
    fun importContacts(
        file: MultipartFile,
        dryRun: Boolean,
        columnMappingJson: String? = null,
        year: Int? = null
    ): ContactsImportResult {
        val errors = mutableListOf<ImportError>()
        val parsedRows = mutableListOf<ParsedContactRow>()

        logger.info("=== KTU Contacts Import Started ===")
        logger.info("File name: ${file.originalFilename}, size: ${file.size} bytes")

        val mapping = if (!columnMappingJson.isNullOrBlank()) {
            parseColumnMapping(columnMappingJson)
        } else {
            ContactsColumnMapping(
                consultant = 0, customer = 1, contactName = 3, email = 4
            )
        }

        if (mapping.consultant == null || mapping.customer == null) {
            return ContactsImportResult(
                valid = false, dryRun = true, totalRows = 0, validRows = 0, skippedRows = 0,
                createdOrganizations = 0, createdContacts = 0, updatedContacts = 0, createdAssignments = 0,
                errors = listOf(ImportError(0, "mapping", null, "Konsulent og Kunde må mappes")),
                unmatchedConsultants = emptyList()
            )
        }

        val allLines = file.inputStream.bufferedReader(Charsets.UTF_8).readLines()
        if (allLines.isEmpty()) {
            return ContactsImportResult(
                valid = false, dryRun = true, totalRows = 0, validRows = 0, skippedRows = 0,
                createdOrganizations = 0, createdContacts = 0, updatedContacts = 0, createdAssignments = 0,
                errors = listOf(ImportError(0, "file", null, "Filen er tom")),
                unmatchedConsultants = emptyList()
            )
        }

        val firstLine = allLines[0]
        val tabCount = firstLine.count { it == '\t' }
        val semiCount = firstLine.count { it == ';' }
        val commaCount = firstLine.count { it == ',' }
        val delimiter = when {
            tabCount > semiCount && tabCount > commaCount -> "\t"
            semiCount > commaCount -> ";"
            else -> ","
        }

        val emptyIndicators = setOf("-", "#I/T", "Not Answered", "N/A", "n/a", "")

        for ((index, line) in allLines.withIndex()) {
            val lineNumber = index + 1
            if (lineNumber == 1) continue

            try {
                val columns = line.split(delimiter).map { it.trim().removeSurrounding("\"") }

                fun getCol(colIndex: Int?): String? = colIndex?.let {
                    columns.getOrNull(it)?.takeIf { v -> v.isNotBlank() && v !in emptyIndicators }
                }

                val consultantName = getCol(mapping.consultant)
                val customerName = getCol(mapping.customer)

                if (consultantName == null || customerName == null) {
                    logger.debug("Skipping row $lineNumber: incomplete data")
                    continue
                }

                val contactName = getCol(mapping.contactName)
                val email = getCol(mapping.email)
                val previousEmail = getCol(mapping.previousEmail)
                val canSendSurveyStr = getCol(mapping.canSendSurvey)?.lowercase()
                val canSendSurvey = canSendSurveyStr in listOf("ok", "ok - direkte", "ja", "yes", "true", "1")
                val sentDateStr = getCol(mapping.sentDate)
                val sentDate = sentDateStr?.let { parseDateString(it) }

                parsedRows.add(ParsedContactRow(
                    rowNumber = lineNumber,
                    consultantName = consultantName,
                    customerName = customerName,
                    contactName = contactName,
                    email = email ?: previousEmail,
                    previousEmail = previousEmail,
                    canSendSurvey = canSendSurvey,
                    year = year,  // Use year parameter passed to function
                    sentDate = sentDate
                ))
            } catch (e: Exception) {
                errors.add(ImportError(lineNumber, "line", line.take(50), "Kunne ikke parse linje: ${e.message}"))
            }
        }

        logger.info("Parsed rows: ${parsedRows.size}, Errors: ${errors.size}")

            // Validate consultants
        val consultantNames = parsedRows.map { it.consultantName }.distinct()
        val consultantMap = mutableMapOf<String, User>()
        val ignoredNames = mutableSetOf<String>()  // Former employees - skip silently
        val unmatchedNames = mutableSetOf<String>()
        val allUsers = userRepository.findAll()

        for (name in consultantNames) {
            when (val result = findUserByName(name, allUsers)) {
                is ConsultantLookupResult.Found -> consultantMap[name] = result.user
                is ConsultantLookupResult.Ignored -> {
                    ignoredNames.add(name)
                    logger.info("Ignoring former employee: '$name'")
                }
                is ConsultantLookupResult.NotFound -> unmatchedNames.add(name)
            }
        }

        val unmatchedConsultantsWithSuggestions = unmatchedNames.map { name ->
            val rowCount = parsedRows.count { it.consultantName == name }
            val suggestions = findSimilarUsers(name, allUsers)
            UnmatchedConsultant(name, rowCount, suggestions)
        }

        // Filter out unmatched and ignored consultant rows
        val validRows = parsedRows.filter {
            it.consultantName !in unmatchedNames && it.consultantName !in ignoredNames
        }
        val isValid = errors.isEmpty() && unmatchedNames.isEmpty()

        if (dryRun || !isValid) {
            val orgNames = validRows.map { it.customerName }.distinct()
            val existingOrgs = organizationRepository.findAll().map { it.name.lowercase() }.toSet()
            val orgsToCreate = orgNames.filter { it.lowercase() !in existingOrgs }
            val assignmentsToCreate = validRows.count { it.year != null }

            return ContactsImportResult(
                valid = isValid,
                dryRun = true,
                totalRows = parsedRows.size,
                validRows = validRows.size,
                skippedRows = parsedRows.size - validRows.size,
                createdOrganizations = orgsToCreate.size,
                createdContacts = validRows.count { it.email != null },
                updatedContacts = 0,
                createdAssignments = assignmentsToCreate,
                errors = errors,
                unmatchedConsultants = unmatchedConsultantsWithSuggestions
            )
        }

        // Actually import
        var createdOrgsCount = 0
        var createdContactsCount = 0
        var updatedContactsCount = 0
        var createdAssignmentsCount = 0

        val orgsByName = mutableMapOf<String, KtuCustomerOrganization>()
        val orgNames = validRows.map { it.customerName }.distinct()

        for (orgName in orgNames) {
            val existing = organizationRepository.findByNameIgnoreCase(orgName)
            if (existing != null) {
                orgsByName[orgName] = existing
            } else {
                val org = organizationRepository.save(KtuCustomerOrganization(name = orgName))
                orgsByName[orgName] = org
                createdOrgsCount++
            }
        }

        // Get/create rounds for years
        val roundsByYear = mutableMapOf<Int, KtuRound>()
        val years = validRows.mapNotNull { it.year }.distinct()
        for (year in years) {
            val existing = roundRepository.findByYear(year)
            if (existing != null) {
                roundsByYear[year] = existing
            } else {
                val round = roundRepository.save(KtuRound(
                    name = "KTU $year",
                    year = year,
                    status = KtuRoundStatus.CLOSED
                ))
                roundsByYear[year] = round
            }
        }

        // Track created contacts by email to reuse
        val contactsByEmail = mutableMapOf<String, KtuCustomerContact>()

        for (row in validRows) {
            val organization = orgsByName[row.customerName] ?: continue
            val consultant = consultantMap[row.consultantName] ?: continue

            // Get or create contact
            var contact: KtuCustomerContact? = null
            if (row.email != null) {
                contact = contactsByEmail[row.email.lowercase()]
                if (contact == null) {
                    val existingContact = contactRepository.findByEmailIgnoreCase(row.email)
                    if (existingContact != null) {
                        if (existingContact.name != row.contactName && row.contactName != null) {
                            contact = contactRepository.save(existingContact.copy(name = row.contactName))
                            updatedContactsCount++
                        } else {
                            contact = existingContact
                        }
                    } else {
                        contact = contactRepository.save(KtuCustomerContact(
                            name = row.contactName ?: "Kontakt (${row.customerName})",
                            email = row.email,
                            organization = organization,
                            active = row.canSendSurvey
                        ))
                        createdContactsCount++
                    }
                    contactsByEmail[row.email.lowercase()] = contact
                }
            }

            // Create contact without email if needed (either by contactName or placeholder for sentDate)
            if (contact == null && row.contactName != null) {
                contact = contactRepository.save(KtuCustomerContact(
                    name = row.contactName,
                    email = null,
                    organization = organization,
                    active = row.canSendSurvey
                ))
                createdContactsCount++
            }

            // Create placeholder contact if we have sentDate but no contact info (e.g., Overhuset surveys)
            if (contact == null && row.sentDate != null && row.year != null) {
                contact = contactRepository.save(KtuCustomerContact(
                    name = "Kontakt (${organization.name})",
                    email = null,
                    organization = organization,
                    active = false
                ))
                createdContactsCount++
                logger.info("Created placeholder contact for ${organization.name} (sent via Overhuset)")
            }

            // Create assignment if year is specified and we have a contact
            logger.info("Row ${row.rowNumber}: year=${row.year}, contact=${contact?.id}, sentDate=${row.sentDate}, email=${row.email}, contactName=${row.contactName}")
            if (row.year != null && contact != null) {
                val round = roundsByYear[row.year] ?: continue

                // Check if assignment already exists
                val existingAssignment = assignmentRepository.findByRoundIdAndConsultantIdAndContactId(
                    round.id!!, consultant.id!!, contact.id!!
                )

                val assignment = if (existingAssignment == null) {
                    val newAssignment = assignmentRepository.save(KtuAssignment(
                        round = round,
                        consultant = consultant,
                        contact = contact
                    ))
                    createdAssignmentsCount++
                    newAssignment
                } else {
                    existingAssignment
                }

                // Create invitation if we have a sent date
                if (row.sentDate != null) {
                    val existingInvitation = invitationRepository.findByAssignmentId(assignment.id!!).firstOrNull()
                    if (existingInvitation == null) {
                        invitationRepository.save(KtuInvitation(
                            assignment = assignment,
                            status = KtuInvitationStatus.SENT,
                            sentAt = row.sentDate.atStartOfDay()
                        ))
                    }
                }
            }
        }

        logger.info("Contacts import completed: orgs=$createdOrgsCount, contacts=$createdContactsCount, updated=$updatedContactsCount, assignments=$createdAssignmentsCount")

        return ContactsImportResult(
            valid = true,
            dryRun = false,
            totalRows = parsedRows.size,
            validRows = validRows.size,
            skippedRows = parsedRows.size - validRows.size,
            createdOrganizations = createdOrgsCount,
            createdContacts = createdContactsCount,
            updatedContacts = updatedContactsCount,
            createdAssignments = createdAssignmentsCount,
            errors = errors,
            unmatchedConsultants = unmatchedConsultantsWithSuggestions
        )
    }

    private fun findUserByName(name: String, allUsers: List<User>): ConsultantLookupResult {
        // 1. Check alias table first
        val alias = consultantAliasRepository.findByAliasNameIgnoreCase(name)
        if (alias != null) {
            // Check if this is an "ignore" alias (for former employees)
            if (alias.isIgnored()) {
                logger.debug("Ignoring consultant via alias: '$name' (former employee)")
                return ConsultantLookupResult.Ignored
            }
            logger.debug("Found user via alias: '$name' -> '${alias.user?.name}'")
            return ConsultantLookupResult.Found(alias.user!!)
        }

        // 2. Try exact match
        val exactMatch = userRepository.findUserByName(name)
        if (exactMatch != null) return ConsultantLookupResult.Found(exactMatch)

        // 3. Fuzzy matching
        val searchParts = name.lowercase().split(" ").filter { it.isNotBlank() }
        if (searchParts.size < 2) {
            val found = allUsers.find { it.name?.equals(name, ignoreCase = true) == true }
            return if (found != null) ConsultantLookupResult.Found(found) else ConsultantLookupResult.NotFound
        }

        val searchFirstName = searchParts.first()
        val searchLastName = searchParts.last()

        val matched = allUsers.find { user ->
            val userName = user.name ?: return@find false
            val userParts = userName.lowercase().split(" ").filter { it.isNotBlank() }
            if (userParts.size < 2) return@find false
            userParts.first() == searchFirstName && userParts.last() == searchLastName
        }

        return if (matched != null) ConsultantLookupResult.Found(matched) else ConsultantLookupResult.NotFound
    }

    private fun findSimilarUsers(name: String, allUsers: List<User>): List<SuggestedMatch> {
        val searchParts = name.lowercase().split(" ").filter { it.isNotBlank() }
        val searchFirstName = searchParts.firstOrNull() ?: ""
        val searchLastName = searchParts.lastOrNull() ?: ""

        return allUsers
            .mapNotNull { user ->
                val userName = user.name ?: return@mapNotNull null
                val userId = user.id ?: return@mapNotNull null

                val userParts = userName.lowercase().split(" ").filter { it.isNotBlank() }
                val userFirstName = userParts.firstOrNull() ?: ""
                val userLastName = userParts.lastOrNull() ?: ""

                var similarity = 0.0
                if (userFirstName == searchFirstName) similarity += 0.4
                else if (userFirstName.startsWith(searchFirstName) || searchFirstName.startsWith(userFirstName)) similarity += 0.2

                if (userLastName == searchLastName) similarity += 0.4
                else if (userLastName.startsWith(searchLastName) || searchLastName.startsWith(userLastName)) similarity += 0.2

                if (userName.lowercase().contains(name.lowercase()) || name.lowercase().contains(userName.lowercase())) similarity += 0.2

                if (similarity > 0.2) SuggestedMatch(userId, userName, similarity) else null
            }
            .sortedByDescending { it.similarity }
            .take(5)
    }

    private fun parseDateString(dateStr: String): java.time.LocalDate? {
        return try {
            // Try formats: dd.MM.yyyy, dd/MM/yyyy, yyyy-MM-dd
            val cleanDate = dateStr.trim()
            when {
                cleanDate.contains(".") -> {
                    val parts = cleanDate.split(".")
                    if (parts.size == 3) {
                        java.time.LocalDate.of(
                            parts[2].toInt(),
                            parts[1].toInt(),
                            parts[0].toInt()
                        )
                    } else null
                }
                cleanDate.contains("/") -> {
                    val parts = cleanDate.split("/")
                    if (parts.size == 3) {
                        java.time.LocalDate.of(
                            parts[2].toInt(),
                            parts[1].toInt(),
                            parts[0].toInt()
                        )
                    } else null
                }
                cleanDate.contains("-") -> {
                    java.time.LocalDate.parse(cleanDate)
                }
                else -> null
            }
        } catch (e: Exception) {
            logger.debug("Could not parse date: $dateStr")
            null
        }
    }
}
