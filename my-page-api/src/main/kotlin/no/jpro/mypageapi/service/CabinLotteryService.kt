package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID
import kotlin.random.Random

@Service
class CabinLotteryService(
    private val drawingRepository: CabinDrawingRepository,
    private val periodRepository: CabinPeriodRepository,
    private val wishRepository: CabinWishRepository,
    private val allocationRepository: CabinAllocationRepository,
    private val apartmentRepository: ApartmentRepository,
    private val executionRepository: CabinDrawingExecutionRepository
) {
    private val logger = LoggerFactory.getLogger(CabinLotteryService::class.java)

    /**
     * Utfører snake draft trekning og oppretter en ny execution
     *
     * Algoritme:
     * 1. Trekk tilfeldig rekkefølge av deltakere
     * 2. Gå nedover listen: hver person får én tildeling hvis mulig
     * 3. Gå oppover listen: hver person får én tildeling til hvis mulig (maks 2 totalt)
     * 4. Hvis ingen ønsker er ledige, får personen ingenting den runden
     */
    @Transactional
    fun performSnakeDraft(drawingId: UUID, executedBy: Long, seed: Long? = null): DrawingResultDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }

        if (drawing.status != DrawingStatus.LOCKED && drawing.status != DrawingStatus.DRAWN) {
            throw IllegalStateException("Drawing must be locked or drawn before performing draw. Current status: ${drawing.status}")
        }

        // Prevent new executions if an execution has already been published
        if (drawing.publishedExecutionId != null) {
            throw IllegalStateException("Cannot run new drawing after an execution has been published")
        }
        
        // Hent alle deltakere
        val participants = wishRepository.findDistinctUsersByDrawing(drawing)
        
        if (participants.isEmpty()) {
            throw IllegalStateException("No participants found for drawing")
        }
        
        // Trekk tilfeldig rekkefølge
        val random = if (seed != null) Random(seed) else Random.Default
        val shuffledParticipants = participants.shuffled(random)
        
        logger.info("Starting snake draft for drawing $drawingId with ${shuffledParticipants.size} participants")
        logger.info("Participant order: ${shuffledParticipants.map { it.email }}")

        // Hent alle ønsker per person, sortert etter prioritet, og shuffle innenfor hver prioritetsgruppe
        val wishesByUser = shuffledParticipants.associateWith { user ->
            val wishes = wishRepository.findByDrawingAndUserOrderByPriority(drawing, user)
            shuffleWishesWithinPriority(wishes, random)
        }
        
        // Opprett snake order: ned og opp
        val snakeOrder = shuffledParticipants + shuffledParticipants.reversed()

        // State tracking
        val allocations = mutableListOf<Triple<CabinPeriod, Apartment, User>>() // Store tuples until we create execution
        val occupiedSlots = mutableSetOf<Pair<UUID, Long>>() // (periodId, apartmentId)
        val allocationCount = mutableMapOf<Long, Int>() // userId -> antall tildelinger
        val userPeriods = mutableMapOf<Long, MutableSet<UUID>>() // userId -> set of periodIds
        val auditLog = mutableListOf<String>()

        // Log snake order setup
        auditLog.add("=== SNAKE DRAFT TREKNING ===")
        auditLog.add("Trekning: ${drawing.season}")
        auditLog.add("Tidspunkt: ${LocalDateTime.now()}")
        auditLog.add("Seed: ${seed ?: "tilfeldig"}")
        auditLog.add("Antall deltakere: ${shuffledParticipants.size}")
        auditLog.add("")
        auditLog.add("Tilfeldig rekkefølge:")
        shuffledParticipants.forEachIndexed { idx, user ->
            auditLog.add("  ${idx + 1}. ${user.name} (${user.email})")
        }
        auditLog.add("")
        auditLog.add("Snake-rekkefølge:")
        auditLog.add("  Runde 1 (nedover): ${shuffledParticipants.map { it.name }.joinToString(" → ")}")
        auditLog.add("  Runde 2 (oppover): ${shuffledParticipants.reversed().map { it.name }.joinToString(" → ")}")
        auditLog.add("")
        auditLog.add("=== START FORDELING ===")
        
        // Gå gjennom snake order
        for ((index, user) in snakeOrder.withIndex()) {
            val currentAllocations = allocationCount.getOrDefault(user.id!!, 0)
            val round = if (index < shuffledParticipants.size) 1 else 2
            val positionInRound = if (index < shuffledParticipants.size) index + 1 else (snakeOrder.size - index)

            auditLog.add("")
            auditLog.add("Tur ${index + 1}/${snakeOrder.size} (Runde $round, posisjon $positionInRound): ${user.name}")

            // Hopp over hvis personen allerede har fått to tildelinger
            if (currentAllocations >= 2) {
                auditLog.add("  → Allerede fått 2 tildelinger, hopper over")
                logger.debug("User ${user.email} already has 2 allocations, skipping")
                continue
            }

            val wishes = wishesByUser[user] ?: emptyList()
            val direction = if (index < shuffledParticipants.size) "down" else "up"

            auditLog.add("  Antall tildelinger så langt: $currentAllocations")
            auditLog.add("  Evaluerer ${wishes.size} ønsker i prioritert rekkefølge...")

            logger.debug("Evaluating user ${user.email} (${index + 1}/${snakeOrder.size}, direction: $direction, current allocations: $currentAllocations)")

            // Prøv hvert ønske i prioritert rekkefølge
            var allocated = false
            for (wish in wishes) {
                val desiredApartmentNames = wish.desiredApartments.sortedBy { it.sort_order }.mapNotNull { it.cabin_name }.joinToString(", ")
                auditLog.add("    Prioritet ${wish.priority}: ${wish.period.description} - ${desiredApartmentNames}")

                // Sjekk om brukeren allerede har fått denne perioden
                val userPeriodsSet = userPeriods.getOrDefault(user.id!!, emptySet())
                if (userPeriodsSet.contains(wish.period.id!!)) {
                    auditLog.add("      ✗ Brukeren har allerede denne perioden")
                    continue
                }

                // Prøv å finne en ledig enhet som matcher ønsket
                val availableApartment = wish.desiredApartments.sortedBy { it.sort_order }.firstOrNull { apartment: Apartment ->
                    val slot = Pair(wish.period.id!!, apartment.id!!)
                    !occupiedSlots.contains(slot)
                }

                if (availableApartment != null) {
                    // Note: We'll create allocations without execution for now, then update after execution is created
                    allocations.add(Triple(wish.period, availableApartment, user))

                    val slot = Pair(wish.period.id!!, availableApartment.id!!)
                    occupiedSlots.add(slot)
                    allocationCount[user.id] = currentAllocations + 1

                    // Marker at brukeren har fått denne perioden
                    userPeriods.getOrPut(user.id) { mutableSetOf() }.add(wish.period.id!!)

                    allocated = true

                    auditLog.add("      ✓ TILDELT: ${availableApartment.cabin_name} i ${wish.period.description}")
                    logger.info("Allocated: ${user.email} -> ${availableApartment.cabin_name} (${wish.period.description}) [priority ${wish.priority}]")
                    break // Gå til neste person
                } else {
                    auditLog.add("      ✗ Ingen ledige enheter")
                }
            }

            if (!allocated) {
                auditLog.add("  → Fikk ingen tildeling i denne runden")
                logger.debug("No available wish for ${user.email} in this round")
            }
        }

        // Legg til oppsummering i audit log
        auditLog.add("")
        auditLog.add("=== TREKNING FULLFØRT ===")
        auditLog.add("Totalt antall tildelinger: ${allocations.size}")
        val allocationsPerUser = allocations.groupBy { it.third.id }
        auditLog.add("Deltakere som fikk 0 tildelinger: ${participants.count { user -> allocationsPerUser[user.id]?.size ?: 0 == 0 }}")
        auditLog.add("Deltakere som fikk 1 tildeling: ${participants.count { user -> allocationsPerUser[user.id]?.size == 1 }}")
        auditLog.add("Deltakere som fikk 2 tildelinger: ${participants.count { user -> allocationsPerUser[user.id]?.size == 2 }}")

        // Serialize audit log to JSON string
        val auditLogJson = com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(auditLog)

        // Create the execution
        val execution = CabinDrawingExecution(
            drawing = drawing,
            executedAt = LocalDateTime.now(),
            executedBy = executedBy,
            randomSeed = seed,
            auditLog = auditLogJson
        )
        val savedExecution = executionRepository.save(execution)

        // Now create and save the actual allocations with execution reference
        val allocationEntities = allocations.map { (period, apartment, user) ->
            CabinAllocation(
                drawing = drawing,
                execution = savedExecution,
                period = period,
                apartment = apartment,
                user = user,
                allocationType = AllocationType.DRAWN,
                allocatedAt = LocalDateTime.now()
            )
        }
        allocationRepository.saveAll(allocationEntities)

        // Update drawing status to DRAWN after performing the first execution
        if (drawing.status == DrawingStatus.LOCKED) {
            drawing.status = DrawingStatus.DRAWN
            drawingRepository.save(drawing)
            logger.info("Drawing status updated to DRAWN")
        }

        logger.info("Snake draft completed. Total allocations: ${allocationEntities.size}, Execution ID: ${savedExecution.id}")

        return createDrawingResult(drawing, savedExecution, allocationEntities, participants, auditLog)
    }
    
    private fun createDrawingResult(
        drawing: CabinDrawing,
        execution: CabinDrawingExecution,
        allocations: List<CabinAllocation>,
        participants: List<User>,
        auditLog: List<String>
    ): DrawingResultDTO {
        val allocationDTOs = allocations.map { allocation ->
            CabinAllocationDTO(
                id = allocation.id,
                periodId = allocation.period.id!!,
                periodDescription = allocation.period.description,
                startDate = allocation.period.startDate,
                endDate = allocation.period.endDate,
                apartmentId = allocation.apartment.id!!,
                apartmentName = allocation.apartment.cabin_name ?: "Unknown",
                apartmentSortOrder = allocation.apartment.sort_order,
                userId = allocation.user.id!!,
                userName = allocation.user.name ?: "Unknown",
                userEmail = allocation.user.email ?: "Unknown",
                allocationType = allocation.allocationType.name,
                comment = allocation.comment,
                allocatedAt = allocation.allocatedAt
            )
        }

        // Beregn statistikk
        val allocationsPerUser = allocations.groupBy { it.user.id }
        val withZero = participants.count { user -> allocationsPerUser[user.id]?.size ?: 0 == 0 }
        val withOne = participants.count { user -> allocationsPerUser[user.id]?.size == 1 }
        val withTwo = participants.count { user -> allocationsPerUser[user.id]?.size == 2 }

        val allocationsPerPeriod = allocations
            .groupBy { it.period.description }
            .mapValues { it.value.size }

        val statistics = DrawingStatisticsDTO(
            totalParticipants = participants.size,
            participantsWithZeroAllocations = withZero,
            participantsWithOneAllocation = withOne,
            participantsWithTwoAllocations = withTwo,
            totalAllocations = allocations.size,
            allocationsPerPeriod = allocationsPerPeriod
        )

        return DrawingResultDTO(
            drawingId = drawing.id!!,
            executionId = execution.id!!,
            season = drawing.season,
            drawnAt = execution.executedAt,
            allocations = allocationDTOs,
            statistics = statistics,
            auditLog = auditLog
        )
    }

    /**
     * Shuffler ønsker med samme prioritet tilfeldig.
     * Ønsker med lavere prioritet (lavere tall) evalueres fortsatt først,
     * men innenfor hver prioritetsgruppe blir rekkefølgen tilfeldig.
     */
    private fun shuffleWishesWithinPriority(wishes: List<CabinWish>, random: Random): List<CabinWish> {
        return wishes
            .groupBy { it.priority }           // Grupper etter prioritet
            .toSortedMap()                      // Sorter gruppene etter prioritet (1, 2, 3, ...)
            .flatMap { (_, wishesInGroup) ->
                wishesInGroup.shuffled(random)  // Shuffle innenfor hver gruppe
            }
    }
}
