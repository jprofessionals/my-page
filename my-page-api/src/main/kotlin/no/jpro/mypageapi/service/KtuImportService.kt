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
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

data class ImportError(
    val row: Int,
    val field: String,
    val value: String?,
    val error: String
)

data class SuggestedMatch(
    val userId: Long,
    val userName: String,
    val similarity: Double  // 0.0 to 1.0
)

data class UnmatchedConsultant(
    val name: String,
    val rowCount: Int,
    val suggestions: List<SuggestedMatch>
)

// Result of looking up a consultant by name
sealed class ConsultantLookupResult {
    data class Found(val user: User) : ConsultantLookupResult()
    data object Ignored : ConsultantLookupResult()  // Former employee, skip these rows
    data object NotFound : ConsultantLookupResult()
}

data class ImportResult(
    val valid: Boolean,
    val dryRun: Boolean,
    val totalRows: Int,
    val validRows: Int,
    val importedResponses: Int,
    val skippedRows: Int,
    val errors: List<ImportError>,
    val newOrganizations: Int,
    val newContacts: Int,
    val roundsToCreate: List<String>,
    val createdRounds: Int,
    val unmatchedConsultants: List<UnmatchedConsultant> = emptyList()
)

data class ParsedRow(
    val rowNumber: Int,
    val date: LocalDateTime,
    val year: Int,
    val customerName: String,
    val consultantName: String,
    val contactEmail: String?,
    val responses: Map<String, Int?>,      // Question code -> rating (null = not answered)
    val comments: Map<String, String?>     // Question code -> comment
)

enum class ImportFieldType {
    DATE, TEXT, RATING, COMMENT
}

data class ImportField(
    val key: String,
    val label: String,
    val required: Boolean,
    val type: ImportFieldType
)

data class CsvPreview(
    val columns: List<String>,
    val sampleRows: List<List<String>>,
    val totalRows: Int,
    val delimiter: String,
    val requiredFields: List<ImportField>
)

data class ColumnMapping(
    val date: Int? = null,
    val customer: Int? = null,
    val consultant: Int? = null,
    val email: Int? = null,
    val q1Rating: Int? = null,
    val q1Comment: Int? = null,
    val q2Rating: Int? = null,
    val q2Comment: Int? = null,
    val q3Rating: Int? = null,
    val q3Comment: Int? = null,
    val q4Rating: Int? = null,
    val q4Comment: Int? = null,
    val q5Rating: Int? = null,
    val q5Comment: Int? = null,
    val q6Rating: Int? = null,
    val q6Comment: Int? = null,
    val q7Comment: Int? = null
)

@Service
class KtuImportService(
    private val roundRepository: KtuRoundRepository,
    private val organizationRepository: KtuOrganizationRepository,
    private val contactRepository: KtuContactRepository,
    private val questionRepository: KtuQuestionRepository,
    private val assignmentRepository: KtuAssignmentRepository,
    private val invitationRepository: KtuInvitationRepository,
    private val responseRepository: KtuResponseRepository,
    private val userRepository: UserRepository,
    private val organizationService: KtuOrganizationService,
    private val consultantAliasRepository: KtuConsultantAliasRepository
) {
    private val logger = LoggerFactory.getLogger(KtuImportService::class.java)

    companion object {
        private val DATE_FORMATTERS = listOf(
            // ISO format
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            // Norwegian format
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
            // American format with AM/PM (SurveyMonkey export)
            DateTimeFormatter.ofPattern("M/d/yyyy h:mm:ss a", Locale.US),
            DateTimeFormatter.ofPattern("MM/dd/yyyy h:mm:ss a", Locale.US),
            DateTimeFormatter.ofPattern("M/d/yyyy H:mm:ss", Locale.US),
            DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss", Locale.US),
            DateTimeFormatter.ofPattern("M/d/yyyy", Locale.US),
            DateTimeFormatter.ofPattern("MM/dd/yyyy", Locale.US)
        )

        val REQUIRED_FIELDS = listOf(
            ImportField("date", "Dato", true, ImportFieldType.DATE),
            ImportField("customer", "Kunde/Organisasjon", true, ImportFieldType.TEXT),
            ImportField("consultant", "Konsulent", true, ImportFieldType.TEXT),
            ImportField("email", "E-post (kontakt)", false, ImportFieldType.TEXT),
            ImportField("q1Rating", "Q1: Utført arbeid (1-6)", false, ImportFieldType.RATING),
            ImportField("q1Comment", "Q1: Kommentar", false, ImportFieldType.COMMENT),
            ImportField("q2Rating", "Q2: Kompetanse (1-6)", false, ImportFieldType.RATING),
            ImportField("q2Comment", "Q2: Kommentar", false, ImportFieldType.COMMENT),
            ImportField("q3Rating", "Q3: Kompetansedeling (1-6)", false, ImportFieldType.RATING),
            ImportField("q3Comment", "Q3: Kommentar", false, ImportFieldType.COMMENT),
            ImportField("q4Rating", "Q4: Samarbeid (1-6)", false, ImportFieldType.RATING),
            ImportField("q4Comment", "Q4: Kommentar", false, ImportFieldType.COMMENT),
            ImportField("q5Rating", "Q5: JPro oppfølging (1-6)", false, ImportFieldType.RATING),
            ImportField("q5Comment", "Q5: Kommentar", false, ImportFieldType.COMMENT),
            ImportField("q6Rating", "Q6: Kost/nytte (1-6)", false, ImportFieldType.RATING),
            ImportField("q6Comment", "Q6: Kommentar", false, ImportFieldType.COMMENT),
            ImportField("q7Comment", "Q7: Ekstra kommentar", false, ImportFieldType.COMMENT)
        )

        private val objectMapper = jacksonObjectMapper()
    }

    /**
     * Preview a CSV file - read headers and sample rows
     */
    fun previewCsv(file: MultipartFile): CsvPreview {
        val lines = mutableListOf<String>()
        var totalDataRows = 0
        var isHeader = true

        BufferedReader(InputStreamReader(file.inputStream, Charsets.UTF_8)).use { reader ->
            reader.forEachLine { line ->
                if (isHeader) {
                    // Always include header
                    lines.add(line)
                    isHeader = false
                } else {
                    // Only count non-empty data rows
                    val trimmed = line.trim()
                    if (trimmed.isNotEmpty() && !trimmed.all { it == ',' || it == ';' || it == '"' || it == '\t' }) {
                        totalDataRows++
                        if (lines.size < 4) { // Header + 3 sample rows
                            lines.add(line)
                        }
                    }
                }
            }
        }

        if (lines.isEmpty()) {
            throw IllegalArgumentException("CSV-filen er tom")
        }

        // Detect delimiter (check tab, semicolon, comma in priority order)
        val firstLine = lines[0]
        val tabCount = firstLine.count { it == '\t' }
        val semiCount = firstLine.count { it == ';' }
        val commaCount = firstLine.count { it == ',' }
        val delimiter = when {
            tabCount > semiCount && tabCount > commaCount -> "\t"
            semiCount > commaCount -> ";"
            else -> ","
        }

        // Parse columns
        val columns = firstLine.split(delimiter).map { it.trim().removeSurrounding("\"") }

        // Parse sample rows
        val sampleRows = lines.drop(1).map { line ->
            line.split(delimiter).map { it.trim().removeSurrounding("\"") }
        }

        return CsvPreview(
            columns = columns,
            sampleRows = sampleRows,
            totalRows = totalDataRows,
            delimiter = if (delimiter == "\t") "TAB" else delimiter,
            requiredFields = REQUIRED_FIELDS
        )
    }

    /**
     * Parse column mapping from JSON string
     */
    fun parseColumnMapping(mappingJson: String?): ColumnMapping {
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
    fun importHistoricalData(
        file: MultipartFile,
        dryRun: Boolean,
        skipUnmatchedConsultants: Boolean,
        importedBy: User?,
        columnMappingJson: String? = null
    ): ImportResult {
        val errors = mutableListOf<ImportError>()
        val parsedRows = mutableListOf<ParsedRow>()

        logger.info("=== KTU Import Started ===")
        logger.info("File name: ${file.originalFilename}, size: ${file.size} bytes")
        logger.info("Column mapping JSON: $columnMappingJson")

        // Parse column mapping (optional - falls back to default if not provided)
        val mapping = if (!columnMappingJson.isNullOrBlank()) {
            parseColumnMapping(columnMappingJson)
        } else {
            logger.warn("No column mapping provided, using default mapping")
            // Default mapping for backwards compatibility
            ColumnMapping(
                date = 0, customer = 1, consultant = 2, email = 3,
                q1Rating = 4, q1Comment = 5, q2Rating = 6, q2Comment = 7,
                q3Rating = 8, q3Comment = 9, q4Rating = 10, q4Comment = 11,
                q5Rating = 12, q5Comment = 13, q6Rating = 14, q6Comment = 15,
                q7Comment = 16
            )
        }

        logger.info("Using mapping: date=${mapping.date}, customer=${mapping.customer}, consultant=${mapping.consultant}")

        // Validate required mappings
        if (mapping.date == null || mapping.customer == null || mapping.consultant == null) {
            return ImportResult(
                valid = false, dryRun = true, totalRows = 0, validRows = 0,
                importedResponses = 0, skippedRows = 0,
                errors = listOf(ImportError(0, "mapping", null, "Dato, Kunde og Konsulent må mappes")),
                newOrganizations = 0, newContacts = 0, roundsToCreate = emptyList(), createdRounds = 0
            )
        }

        // Read entire file content for processing
        val allLines = file.inputStream.bufferedReader(Charsets.UTF_8).readLines()
        logger.info("Total lines in file: ${allLines.size}")

        if (allLines.isEmpty()) {
            return ImportResult(
                valid = false, dryRun = true, totalRows = 0, validRows = 0,
                importedResponses = 0, skippedRows = 0,
                errors = listOf(ImportError(0, "file", null, "Filen er tom")),
                newOrganizations = 0, newContacts = 0, roundsToCreate = emptyList(), createdRounds = 0
            )
        }

        // Detect delimiter from first line (check tab, semicolon, comma in priority order)
        val firstLine = allLines[0]
        val tabCount = firstLine.count { it == '\t' }
        val semiCount = firstLine.count { it == ';' }
        val commaCount = firstLine.count { it == ',' }
        val delimiter = when {
            tabCount > semiCount && tabCount > commaCount -> "\t"
            semiCount > commaCount -> ";"
            else -> ","
        }
        logger.info("Detected delimiter: '${if (delimiter == "\t") "TAB" else delimiter}' (tab=$tabCount, semi=$semiCount, comma=$commaCount)")

        // Log first few lines for debugging
        allLines.take(3).forEachIndexed { idx, line ->
            logger.info("Line $idx: ${line.take(100)}...")
        }

        // Parse CSV (skip header)
        for ((index, line) in allLines.withIndex()) {
            val lineNumber = index + 1
            if (lineNumber == 1) continue // Skip header

            try {
                val parsed = parseLineWithMapping(line, lineNumber, delimiter, mapping, errors)
                if (parsed != null) {
                    parsedRows.add(parsed)
                }
            } catch (e: Exception) {
                errors.add(ImportError(lineNumber, "line", line.take(50), "Kunne ikke parse linje: ${e.message}"))
            }
        }

        logger.info("Parsed rows: ${parsedRows.size}, Errors: ${errors.size}")

        // Validate consultants exist
        val consultantNames = parsedRows.map { it.consultantName }.distinct()
        val consultantMap = mutableMapOf<String, User>()
        val ignoredNames = mutableSetOf<String>()  // Former employees - skip silently
        val unmatchedNames = mutableSetOf<String>()
        val allUsers = userRepository.findAll()

        for (name in consultantNames) {
            when (val result = findUserByName(name)) {
                is ConsultantLookupResult.Found -> consultantMap[name] = result.user
                is ConsultantLookupResult.Ignored -> {
                    ignoredNames.add(name)
                    logger.info("Ignoring former employee: '$name'")
                }
                is ConsultantLookupResult.NotFound -> {
                    unmatchedNames.add(name)
                    if (!skipUnmatchedConsultants) {
                        errors.add(ImportError(0, "konsulent", name, "Konsulent ikke funnet i systemet"))
                    }
                }
            }
        }

        // Build unmatched consultants with suggestions
        val unmatchedConsultantsWithSuggestions = unmatchedNames.map { name ->
            val rowCount = parsedRows.count { it.consultantName == name }
            val suggestions = findSimilarUsers(name, allUsers)
            UnmatchedConsultant(name, rowCount, suggestions)
        }

        // Filter out unmatched and ignored consultant rows
        // Ignored = former employees (skip silently), Unmatched = not found (may show error)
        val validRows = parsedRows.filter {
            it.consultantName !in unmatchedNames && it.consultantName !in ignoredNames
        }

        // Calculate what will be created
        val years = validRows.map { it.year }.distinct()
        val existingYears = roundRepository.findAll().map { it.year }.toSet()
        val yearsToCreate = years.filter { it !in existingYears }

        val orgNames = validRows.map { it.customerName }.distinct()
        val existingOrgs = organizationRepository.findAll().map { it.name.lowercase() }.toSet()
        val orgsToCreate = orgNames.filter { it.lowercase() !in existingOrgs }

        // Estimate contacts to create (simplified - actual count depends on org)
        val newContactsEstimate = validRows
            .filter { it.contactEmail != null && it.contactEmail != "#I/T" }
            .map { "${it.customerName}|${it.contactEmail}" }
            .distinct()
            .count()

        val isValid = errors.isEmpty() || (skipUnmatchedConsultants && errors.all { it.field == "konsulent" })

        if (dryRun || !isValid) {
            return ImportResult(
                valid = isValid,
                dryRun = true,
                totalRows = parsedRows.size,
                validRows = validRows.size,
                importedResponses = 0,
                skippedRows = parsedRows.size - validRows.size,
                errors = errors,
                newOrganizations = orgsToCreate.size,
                newContacts = newContactsEstimate,
                roundsToCreate = yearsToCreate.map { it.toString() },
                createdRounds = 0,
                unmatchedConsultants = unmatchedConsultantsWithSuggestions
            )
        }

        // Actually import
        var importedCount = 0
        var createdRoundsCount = 0
        var createdOrgsCount = 0
        var createdContactsCount = 0

        // Create missing rounds
        val roundsByYear = mutableMapOf<Int, KtuRound>()
        for (year in years) {
            val existing = roundRepository.findByYear(year)
            if (existing != null) {
                roundsByYear[year] = existing
            } else {
                val round = roundRepository.save(KtuRound(
                    name = "KTU $year (importert)",
                    year = year,
                    status = KtuRoundStatus.CLOSED,
                    createdBy = importedBy
                ))
                roundsByYear[year] = round
                createdRoundsCount++
            }
        }

        // Get/create organizations
        val orgsByName = mutableMapOf<String, KtuCustomerOrganization>()
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

        // Load questions
        val questions = questionRepository.findAll().associateBy { it.code }

        // Process each row
        for (row in validRows) {
            val consultant = consultantMap[row.consultantName] ?: continue
            val round = roundsByYear[row.year] ?: continue
            val organization = orgsByName[row.customerName] ?: continue

            // First, look for existing assignment for this consultant+round that has a contact in this organization
            // This allows us to use contact info that was imported separately via the contacts import
            val existingAssignments = assignmentRepository.findByRoundIdAndConsultantId(round.id!!, consultant.id!!)
            val existingAssignmentWithOrg = existingAssignments.find { it.contact.organization.id == organization.id }

            val assignment: KtuAssignment
            if (existingAssignmentWithOrg != null) {
                // Use the existing assignment with proper contact info
                assignment = existingAssignmentWithOrg
            } else {
                // No existing assignment - get or create contact
                val contact = getOrCreateContact(organization, row.contactEmail, row)
                if (contact == null) {
                    createdContactsCount++ // We created a placeholder
                }
                val finalContact = contact ?: createPlaceholderContact(organization, row)

                // Check if assignment exists for this contact
                val existingAssignment = existingAssignments.find { it.contact.id == finalContact.id }

                assignment = existingAssignment ?: assignmentRepository.save(KtuAssignment(
                    round = round,
                    consultant = consultant,
                    contact = finalContact,
                    createdBy = importedBy
                ))
            }

            // Find existing invitation or create new one
            val existingInvitation = invitationRepository.findByAssignmentId(assignment.id!!).firstOrNull()
            val invitation = if (existingInvitation != null) {
                // Update existing invitation to RESPONDED status
                invitationRepository.save(existingInvitation.copy(
                    status = KtuInvitationStatus.RESPONDED,
                    respondedAt = row.date
                ))
            } else {
                // Create new invitation (historical data without token)
                invitationRepository.save(KtuInvitation(
                    assignment = assignment,
                    token = null,
                    status = KtuInvitationStatus.RESPONDED,
                    respondedAt = row.date
                ))
            }

            // Create responses
            createResponses(invitation, row, questions)
            importedCount++
        }

        return ImportResult(
            valid = true,
            dryRun = false,
            totalRows = parsedRows.size,
            validRows = validRows.size,
            importedResponses = importedCount,
            skippedRows = parsedRows.size - validRows.size,
            errors = errors.filter { it.field != "konsulent" || !skipUnmatchedConsultants },
            newOrganizations = createdOrgsCount,
            newContacts = createdContactsCount,
            roundsToCreate = yearsToCreate.map { it.toString() },
            createdRounds = createdRoundsCount,
            unmatchedConsultants = unmatchedConsultantsWithSuggestions
        )
    }

    private fun parseLineWithMapping(
        line: String,
        rowNumber: Int,
        delimiter: String,
        mapping: ColumnMapping,
        errors: MutableList<ImportError>
    ): ParsedRow? {
        val columns = line.split(delimiter).map { it.trim().removeSurrounding("\"") }

        // Common empty value indicators
        val emptyIndicators = setOf("-", "#I/T", "Not Answered", "N/A", "n/a", "")

        // Helper to get column value safely, treating common empty indicators as null
        fun getCol(index: Int?): String? = index?.let {
            columns.getOrNull(it)?.takeIf { v ->
                v.isNotBlank() && v !in emptyIndicators
            }
        }

        // Parse required fields
        val dateStr = getCol(mapping.date)
        val customerName = getCol(mapping.customer)
        val consultantName = getCol(mapping.consultant)

        // Skip rows where ANY required field is empty or has "Not Answered" etc.
        // These are incomplete survey responses and should be skipped silently
        if (dateStr == null || customerName == null || consultantName == null) {
            // Log for debugging but don't report as error - these are incomplete responses
            logger.debug("Skipping row $rowNumber: incomplete data (date=$dateStr, customer=$customerName, consultant=$consultantName)")
            return null
        }

        // Validate date format
        val date = parseDate(dateStr)
        if (date == null) {
            errors.add(ImportError(rowNumber, "dato", dateStr, "Ugyldig datoformat"))
            return null
        }

        val email = getCol(mapping.email)

        // Parse ratings (0 means not answered)
        val responses = mutableMapOf<String, Int?>()
        val comments = mutableMapOf<String, String?>()

        fun parseRating(index: Int?): Int? {
            val value = getCol(index) ?: return null
            if (value == "0") return null
            return value.toIntOrNull()?.takeIf { it in 1..6 }
        }

        fun parseComment(index: Int?): String? {
            return getCol(index)
        }

        responses["Q1_WORK"] = parseRating(mapping.q1Rating)
        comments["Q1_WORK_COMMENT"] = parseComment(mapping.q1Comment)
        responses["Q2_COMPETENCE"] = parseRating(mapping.q2Rating)
        comments["Q2_COMPETENCE_COMMENT"] = parseComment(mapping.q2Comment)
        responses["Q3_KNOWLEDGE_SHARING"] = parseRating(mapping.q3Rating)
        comments["Q3_KNOWLEDGE_SHARING_COMMENT"] = parseComment(mapping.q3Comment)
        responses["Q4_COLLABORATION"] = parseRating(mapping.q4Rating)
        comments["Q4_COLLABORATION_COMMENT"] = parseComment(mapping.q4Comment)
        responses["Q5_JPRO_FOLLOWUP"] = parseRating(mapping.q5Rating)
        comments["Q5_JPRO_FOLLOWUP_COMMENT"] = parseComment(mapping.q5Comment)
        responses["Q6_VALUE"] = parseRating(mapping.q6Rating)
        comments["Q6_VALUE_COMMENT"] = parseComment(mapping.q6Comment)
        comments["Q7_ADDITIONAL"] = parseComment(mapping.q7Comment)

        return ParsedRow(
            rowNumber = rowNumber,
            date = date,
            year = date.year,
            customerName = customerName,
            consultantName = consultantName,
            contactEmail = email,
            responses = responses,
            comments = comments
        )
    }

    /**
     * Try to parse date with multiple formats
     */
    private fun parseDate(dateStr: String): LocalDateTime? {
        for (formatter in DATE_FORMATTERS) {
            try {
                return try {
                    LocalDateTime.parse(dateStr, formatter)
                } catch (e: Exception) {
                    // Try parsing as LocalDate and convert to LocalDateTime
                    java.time.LocalDate.parse(dateStr, formatter).atStartOfDay()
                }
            } catch (e: Exception) {
                // Continue trying other formats
            }
        }
        return null
    }

    private fun findUserByName(name: String): ConsultantLookupResult {
        // 1. Check alias table first (for name changes like "Anton Fofanov" -> "Anton Furulund")
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
        if (exactMatch != null) {
            return ConsultantLookupResult.Found(exactMatch)
        }

        // 3. Fuzzy matching for partial names (e.g., "Håvard Andersen" -> "Håvard Stigen Andersen")
        val allUsers = userRepository.findAll()
        val searchParts = name.lowercase().split(" ").filter { it.isNotBlank() }

        if (searchParts.size < 2) {
            // Single word - just do contains matching
            val found = allUsers.find { user ->
                val userName = user.name ?: return@find false
                userName.equals(name, ignoreCase = true)
            }
            return if (found != null) ConsultantLookupResult.Found(found) else ConsultantLookupResult.NotFound
        }

        val searchFirstName = searchParts.first()
        val searchLastName = searchParts.last()

        // Try to match first name + last name (ignoring middle names)
        val matchedUser = allUsers.find { user ->
            val userName = user.name ?: return@find false
            val userParts = userName.lowercase().split(" ").filter { it.isNotBlank() }

            if (userParts.size < 2) return@find false

            val userFirstName = userParts.first()
            val userLastName = userParts.last()

            // Match if first and last names match (allows for missing middle names)
            userFirstName == searchFirstName && userLastName == searchLastName
        }

        if (matchedUser != null) {
            logger.debug("Fuzzy matched: '$name' -> '${matchedUser.name}'")
            return ConsultantLookupResult.Found(matchedUser)
        }

        // 4. Fallback: contains matching
        val fallbackMatch = allUsers.find { user ->
            val userName = user.name ?: return@find false
            userName.contains(name, ignoreCase = true) || name.contains(userName, ignoreCase = true)
        }
        return if (fallbackMatch != null) ConsultantLookupResult.Found(fallbackMatch) else ConsultantLookupResult.NotFound
    }

    /**
     * Find similar users for an unmatched name, using string similarity.
     * Returns up to 5 suggestions sorted by similarity score.
     */
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

                // Calculate similarity based on:
                // 1. First name match (40%)
                // 2. Last name match (40%)
                // 3. Any part contains match (20%)
                var similarity = 0.0

                // First name similarity
                if (userFirstName == searchFirstName) {
                    similarity += 0.4
                } else if (userFirstName.startsWith(searchFirstName) || searchFirstName.startsWith(userFirstName)) {
                    similarity += 0.2
                }

                // Last name similarity
                if (userLastName == searchLastName) {
                    similarity += 0.4
                } else if (userLastName.startsWith(searchLastName) || searchLastName.startsWith(userLastName)) {
                    similarity += 0.2
                }

                // Any part contains
                if (userName.lowercase().contains(name.lowercase()) || name.lowercase().contains(userName.lowercase())) {
                    similarity += 0.2
                }

                // Require at least some similarity
                if (similarity > 0.2) {
                    SuggestedMatch(userId, userName, similarity)
                } else {
                    null
                }
            }
            .sortedByDescending { it.similarity }
            .take(5)
    }

    private fun getOrCreateContact(org: KtuCustomerOrganization, email: String?, row: ParsedRow): KtuCustomerContact? {
        if (email == null) return null
        return contactRepository.findByEmailIgnoreCase(email)
    }

    private fun createPlaceholderContact(org: KtuCustomerOrganization, row: ParsedRow): KtuCustomerContact {
        return contactRepository.save(KtuCustomerContact(
            name = "Kontakt (${row.customerName})",
            email = row.contactEmail,
            organization = org
        ))
    }

    private fun createResponses(
        invitation: KtuInvitation,
        row: ParsedRow,
        questions: Map<String, KtuQuestion>
    ) {
        // Rating questions
        for ((code, rating) in row.responses) {
            if (rating != null) {
                val question = questions[code] ?: continue
                responseRepository.save(KtuResponse(
                    invitation = invitation,
                    question = question,
                    ratingValue = rating
                ))
            }
        }

        // Comment questions
        for ((code, comment) in row.comments) {
            if (comment != null) {
                val question = questions[code] ?: continue
                responseRepository.save(KtuResponse(
                    invitation = invitation,
                    question = question,
                    textValue = comment
                ))
            }
        }
    }
}
