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
    private val apartmentRepository: ApartmentRepository
) {
    private val logger = LoggerFactory.getLogger(CabinLotteryService::class.java)

    /**
     * Utfører snake draft trekning
     * 
     * Algoritme:
     * 1. Trekk tilfeldig rekkefølge av deltakere
     * 2. Gå nedover listen: hver person får én tildeling hvis mulig
     * 3. Gå oppover listen: hver person får én tildeling til hvis mulig (maks 2 totalt)
     * 4. Hvis ingen ønsker er ledige, får personen ingenting den runden
     */
    @Transactional
    fun performSnakeDraft(drawingId: UUID, seed: Long? = null): DrawingResultDTO {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }
        
        if (drawing.status != DrawingStatus.LOCKED) {
            throw IllegalStateException("Drawing must be locked before performing draw. Current status: ${drawing.status}")
        }
        
        // Slett eventuelle eksisterende tildelinger
        allocationRepository.deleteByDrawing(drawing)
        
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
        
        // Hent alle ønsker per person, sortert etter prioritet
        val wishesByUser = shuffledParticipants.associateWith { user ->
            wishRepository.findByDrawingAndUserOrderByPriority(drawing, user)
        }
        
        // Opprett snake order: ned og opp
        val snakeOrder = shuffledParticipants + shuffledParticipants.reversed()
        
        // State tracking
        val allocations = mutableListOf<CabinAllocation>()
        val occupiedSlots = mutableSetOf<Pair<UUID, Long>>() // (periodId, apartmentId)
        val allocationCount = mutableMapOf<Long, Int>() // userId -> antall tildelinger
        
        // Gå gjennom snake order
        for ((index, user) in snakeOrder.withIndex()) {
            val currentAllocations = allocationCount.getOrDefault(user.id!!, 0)
            
            // Hopp over hvis personen allerede har fått to tildelinger
            if (currentAllocations >= 2) {
                logger.debug("User ${user.email} already has 2 allocations, skipping")
                continue
            }
            
            val wishes = wishesByUser[user] ?: emptyList()
            val direction = if (index < shuffledParticipants.size) "down" else "up"
            
            logger.debug("Evaluating user ${user.email} (${index + 1}/${snakeOrder.size}, direction: $direction, current allocations: $currentAllocations)")
            
            // Prøv hvert ønske i prioritert rekkefølge
            var allocated = false
            for (wish in wishes) {
                // Prøv å finne en ledig enhet som matcher ønsket
                val availableApartment = wish.desiredApartments.sortedBy { it.sort_order }.firstOrNull { apartment: Apartment ->
                    val slot = Pair(wish.period.id!!, apartment.id!!)
                    !occupiedSlots.contains(slot)
                }
                
                if (availableApartment != null) {
                    // Tildel og marker som opptatt
                    val allocation = CabinAllocation(
                        drawing = drawing,
                        period = wish.period,
                        apartment = availableApartment,
                        user = user,
                        allocationType = AllocationType.DRAWN,
                        allocatedAt = LocalDateTime.now()
                    )
                    allocations.add(allocation)
                    
                    val slot = Pair(wish.period.id!!, availableApartment.id!!)
                    occupiedSlots.add(slot)
                    allocationCount[user.id] = currentAllocations + 1
                    allocated = true
                    
                    logger.info("Allocated: ${user.email} -> ${availableApartment.cabin_name} (${wish.period.description}) [priority ${wish.priority}]")
                    break // Gå til neste person
                }
            }
            
            if (!allocated) {
                logger.debug("No available wish for ${user.email} in this round")
            }
        }
        
        // Lagre alle tildelinger
        allocationRepository.saveAll(allocations)
        
        // Oppdater drawing status
        val updatedDrawing = drawing.copy(
            status = DrawingStatus.DRAWN,
            drawnAt = LocalDateTime.now(),
            randomSeed = seed
        )
        drawingRepository.save(updatedDrawing)
        
        logger.info("Snake draft completed. Total allocations: ${allocations.size}")
        
        return createDrawingResult(updatedDrawing, allocations, participants)
    }
    
    private fun createDrawingResult(
        drawing: CabinDrawing,
        allocations: List<CabinAllocation>,
        participants: List<User>
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
            season = drawing.season,
            drawnAt = drawing.drawnAt!!,
            allocations = allocationDTOs,
            statistics = statistics
        )
    }
}
