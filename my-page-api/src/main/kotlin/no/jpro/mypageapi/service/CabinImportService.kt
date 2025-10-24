package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.CabinDrawing
import no.jpro.mypageapi.entity.CabinPeriod
import no.jpro.mypageapi.entity.CabinWish
import no.jpro.mypageapi.repository.*
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
class CabinImportService(
    private val drawingRepository: CabinDrawingRepository,
    private val periodRepository: CabinPeriodRepository,
    private val wishRepository: CabinWishRepository,
    private val apartmentRepository: ApartmentRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(CabinImportService::class.java)
    
    /**
     * Importerer ønsker fra CSV-fil (Google Forms format)
     * Format: Timestamp,Email,Vil du være med?,Periode,Enhet,Prioritet,Kommentar,[Har du flere?,...repeat]
     */
    @Transactional
    fun importWishesFromCSV(drawingId: UUID, inputStream: InputStream): ImportResultDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }
        
        val reader = BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8))
        val lines = reader.readLines()
        
        if (lines.isEmpty()) {
            throw IllegalArgumentException("CSV file is empty")
        }
        
        // Skip header
        val dataLines = lines.drop(1)
        
        val periods = periodRepository.findByDrawingOrderBySortOrder(drawing)
        val apartments = apartmentRepository.findAll()
        val apartmentMap = apartments.mapNotNull { apt ->
            apt.cabin_name?.trim()?.let { it to apt }
        }.toMap()
        
        var successCount = 0
        var errorCount = 0
        val errors = mutableListOf<String>()
        
        for ((lineNumber, line) in dataLines.withIndex()) {
            try {
                val wishes = parseCsvLine(line, periods, apartmentMap)
                if (wishes.isNotEmpty()) {
                    val email = wishes.first().email
                    val user = userRepository.findUserByEmail(email)

                    if (user == null) {
                        errors.add("Line ${lineNumber + 2}: User not found: $email")
                        errorCount++
                        continue
                    }

                    saveWishesForUser(drawing, user, wishes, periods, apartmentMap)
                    successCount++
                }
            } catch (e: Exception) {
                logger.error("Error parsing line ${lineNumber + 2}: ${e.message}", e)
                errors.add("Line ${lineNumber + 2}: ${e.message}")
                errorCount++
            }
        }
        
        return ImportResultDTO(
            totalLines = dataLines.size,
            successCount = successCount,
            errorCount = errorCount,
            errors = errors
        )
    }
    
    private fun parseCsvLine(
        line: String,
        periods: List<CabinPeriod>,
        apartmentMap: Map<String, Apartment>
    ): List<ImportWishDTO> {
        // Split by comma, but respect quoted fields
        val fields = splitCsvLine(line)
        
        if (fields.size < 3) {
            throw IllegalArgumentException("Invalid CSV format: too few columns")
        }
        
        val email = fields[1].trim()
        val wantToParticipate = fields[2].trim()
        
        if (wantToParticipate.lowercase() != "ja") {
            return emptyList() // Skip this person
        }
        
        val wishes = mutableListOf<ImportWishItemDTO>()
        
        // Parse wishes - de starter på kolonne 3
        // Format: Periode, Enhet, Prioritet, Kommentar, [Har du flere?]
        var index = 3
        while (index + 3 < fields.size) {
            val periodDesc = fields[index].trim()
            val unitNames = fields[index + 1].split(",").map { it.trim() }
            val priorityStr = fields[index + 2].trim()
            val comment = fields.getOrNull(index + 3)?.trim()
            
            if (periodDesc.isNotEmpty() && unitNames.isNotEmpty() && priorityStr.isNotEmpty()) {
                val priority = priorityStr.toIntOrNull() ?: continue
                
                wishes.add(
                    ImportWishItemDTO(
                        periodDescription = periodDesc,
                        apartmentNames = unitNames,
                        priority = priority,
                        comment = comment
                    )
                )
            }
            
            // Neste ønske starter etter "Har du flere?" felt
            index += 5 // Periode, Enhet, Prioritet, Kommentar, "Har du flere?"
        }
        
        return if (wishes.isNotEmpty()) {
            listOf(ImportWishDTO(email = email, wishes = wishes))
        } else {
            emptyList()
        }
    }
    
    private fun saveWishesForUser(
        drawing: CabinDrawing,
        user: User,
        importWishes: List<ImportWishDTO>,
        periods: List<CabinPeriod>,
        apartmentMap: Map<String, Apartment>
    ) {
        // Slett eksisterende ønsker
        wishRepository.deleteByDrawingAndUser(drawing, user)
        
        val wishes = mutableListOf<CabinWish>()
        
        for (importWish in importWishes) {
            for (wishItem in importWish.wishes) {
                // Finn matching periode
                val period = periods.firstOrNull { period ->
                    period.description.contains(wishItem.periodDescription, ignoreCase = true) ||
                    wishItem.periodDescription.contains(period.description, ignoreCase = true) ||
                    matchPeriodByDates(wishItem.periodDescription, period)
                }
                
                if (period == null) {
                    logger.warn("Could not find period for: ${wishItem.periodDescription}")
                    continue
                }
                
                // Finn matching apartments
                val apartments = wishItem.apartmentNames.mapNotNull { name ->
                    apartmentMap[name] ?: apartmentMap.entries.firstOrNull { (key, _) ->
                        key.contains(name, ignoreCase = true) || name.contains(key, ignoreCase = true)
                    }?.value
                }
                
                if (apartments.isEmpty()) {
                    logger.warn("Could not find apartments for: ${wishItem.apartmentNames}")
                    continue
                }
                
                wishes.add(
                    CabinWish(
                        drawing = drawing,
                        user = user,
                        period = period,
                        priority = wishItem.priority,
                        desiredApartments = apartments,
                        comment = wishItem.comment
                    )
                )
            }
        }
        
        if (wishes.isNotEmpty()) {
            wishRepository.saveAll(wishes)
            logger.info("Saved ${wishes.size} wishes for user ${user.email}")
        }
    }
    
    private fun matchPeriodByDates(periodDescription: String, period: CabinPeriod): Boolean {
        // Prøv å parse datoer fra beskrivelsen, f.eks. "05.11 - 12.11"
        val datePattern = """(\d{2}\.\d{2})""".toRegex()
        val matches = datePattern.findAll(periodDescription).toList()
        
        if (matches.size >= 2) {
            try {
                val formatter = DateTimeFormatter.ofPattern("dd.MM")
                val startDay = LocalDate.parse("${matches[0].value}.${period.startDate.year}", DateTimeFormatter.ofPattern("dd.MM.yyyy"))
                
                return startDay == period.startDate
            } catch (e: Exception) {
                // Ignore parsing errors
            }
        }
        
        return false
    }
    
    private fun splitCsvLine(line: String): List<String> {
        val result = mutableListOf<String>()
        var current = StringBuilder()
        var inQuotes = false
        
        for (char in line) {
            when {
                char == '"' -> inQuotes = !inQuotes
                char == '\t' && !inQuotes -> {
                    result.add(current.toString())
                    current = StringBuilder()
                }
                else -> current.append(char)
            }
        }
        result.add(current.toString())
        
        return result
    }
}

data class ImportResultDTO(
    val totalLines: Int,
    val successCount: Int,
    val errorCount: Int,
    val errors: List<String>
)
