package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.repository.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
import java.time.LocalDate
import java.util.*

@ExtendWith(MockitoExtension::class)
class CabinLotteryServiceTest {
    
    @Mock
    private lateinit var drawingRepository: CabinDrawingRepository
    
    @Mock
    private lateinit var periodRepository: CabinPeriodRepository
    
    @Mock
    private lateinit var wishRepository: CabinWishRepository
    
    @Mock
    private lateinit var allocationRepository: CabinAllocationRepository
    
    @Mock
    private lateinit var apartmentRepository: ApartmentRepository

    @Mock
    private lateinit var executionRepository: CabinDrawingExecutionRepository

    @InjectMocks
    private lateinit var lotteryService: CabinLotteryService
    
    @Test
    fun `test snake draft algorithm with simple case`() {
        // Arrange
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "TEST_2025",
            status = DrawingStatus.LOCKED
        )
        
        // Opprett 3 brukere
        val users = listOf(
            User(id = 1L, email = "user1@jpro.no", name = "User 1", givenName = "User", familyName = "One", budgets = emptyList()),
            User(id = 2L, email = "user2@jpro.no", name = "User 2", givenName = "User", familyName = "Two", budgets = emptyList()),
            User(id = 3L, email = "user3@jpro.no", name = "User 3", givenName = "User", familyName = "Three", budgets = emptyList())
        )
        
        // Opprett 3 apartments
        val hovedhytta = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)
        val leiligheten = Apartment(id = 2L, cabin_name = "Leiligheten", sort_order = 2)
        val annekset = Apartment(id = 3L, cabin_name = "Annekset", sort_order = 3)
        
        // Opprett 2 perioder
        val period1 = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 4, 1),
            endDate = LocalDate.of(2025, 4, 8),
            description = "Påske",
            sortOrder = 1
        )
        
        val period2 = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 2, 18),
            endDate = LocalDate.of(2025, 2, 25),
            description = "Vinterferie",
            sortOrder = 2
        )
        
        // Opprett ønsker
        val wishes = listOf(
            // User 1 ønsker Hovedhytta i påsken, så Leiligheten i vinterferie
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[0],
                period = period1,
                priority = 1,
                desiredApartments = listOf(hovedhytta)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[0],
                period = period2,
                priority = 2,
                desiredApartments = listOf(leiligheten)
            ),
            
            // User 2 ønsker Leiligheten i påsken, så Hovedhytta i vinterferie
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[1],
                period = period1,
                priority = 1,
                desiredApartments = listOf(leiligheten)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[1],
                period = period2,
                priority = 2,
                desiredApartments = listOf(hovedhytta)
            ),
            
            // User 3 ønsker Annekset i påsken, så Annekset i vinterferie
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[2],
                period = period1,
                priority = 1,
                desiredApartments = listOf(annekset)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[2],
                period = period2,
                priority = 2,
                desiredApartments = listOf(annekset)
            )
        )
        
        // Mock repositories
        `when`(drawingRepository.findById(drawingId)).thenReturn(Optional.of(drawing))
        `when`(wishRepository.findDistinctUsersByDrawing(drawing)).thenReturn(users)
        `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, users[0]))
            .thenReturn(wishes.filter { it.user == users[0] })
        `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, users[1]))
            .thenReturn(wishes.filter { it.user == users[1] })
        `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, users[2]))
            .thenReturn(wishes.filter { it.user == users[2] })
        `when`(executionRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { invocation ->
                val execution = invocation.arguments[0] as CabinDrawingExecution
                execution.copy(id = UUID.randomUUID())
            }
        `when`(allocationRepository.saveAll(org.mockito.ArgumentMatchers.anyList()))
            .thenAnswer { it.arguments[0] }
        `when`(drawingRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { it.arguments[0] }
        
        // Act
        val result = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 42L)
        
        // Assert
        assertNotNull(result)
        assertEquals(drawingId, result.drawingId)
        assertTrue(result.allocations.isNotEmpty())
        
        // Verifiser at snake draft fungerer
        // Med seed=42 og 3 brukere, forventet rekkefølge kan variere
        // Men vi kan verifisere at:
        // 1. Ingen periode/apartment-kombinasjon er tildelt to ganger
        val uniquePeriodApartment = result.allocations
            .map { Pair(it.periodId, it.apartmentId) }
            .toSet()
        assertEquals(result.allocations.size, uniquePeriodApartment.size, 
            "Hver periode/apartment-kombinasjon skal bare tildeles én gang")
        
        // 2. Hver bruker får maksimalt 2 tildelinger
        val allocationsPerUser = result.allocations.groupBy { it.userId }
        allocationsPerUser.forEach { (userId, allocations) ->
            assertTrue(allocations.size <= 2, 
                "User $userId fikk ${allocations.size} tildelinger, maks er 2")
        }
        
        // 3. Statistikk er riktig
        assertEquals(users.size, result.statistics.totalParticipants)
        assertEquals(result.allocations.size, result.statistics.totalAllocations)
    }
    
    @Test
    fun `test snake draft handles no available wishes`() {
        // Test at algoritmen håndterer situasjonen der en bruker ikke får noe
        // Dette er en edge case som skal testes separat
        
        // Arrange
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "TEST_2025",
            status = DrawingStatus.LOCKED
        )
        
        val user1 = User(id = 1L, email = "user1@jpro.no", name = "User 1", givenName = "User", familyName = "One", budgets = emptyList())
        val user2 = User(id = 2L, email = "user2@jpro.no", name = "User 2", givenName = "User", familyName = "Two", budgets = emptyList())
        
        val hovedhytta = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)
        
        val period1 = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 4, 1),
            endDate = LocalDate.of(2025, 4, 8),
            description = "Påske",
            sortOrder = 1
        )
        
        // Begge brukerne ønsker samme enhet samme periode
        val wishes = listOf(
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = user1,
                period = period1,
                priority = 1,
                desiredApartments = listOf(hovedhytta)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = user2,
                period = period1,
                priority = 1,
                desiredApartments = listOf(hovedhytta)
            )
        )
        
        // Mock repositories
        `when`(drawingRepository.findById(drawingId)).thenReturn(Optional.of(drawing))
        `when`(wishRepository.findDistinctUsersByDrawing(drawing)).thenReturn(listOf(user1, user2))
        `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, user1))
            .thenReturn(listOf(wishes[0]))
        `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, user2))
            .thenReturn(listOf(wishes[1]))
        `when`(executionRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { invocation ->
                val execution = invocation.arguments[0] as CabinDrawingExecution
                execution.copy(id = UUID.randomUUID())
            }
        `when`(allocationRepository.saveAll(org.mockito.ArgumentMatchers.anyList()))
            .thenAnswer { it.arguments[0] }
        `when`(drawingRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { it.arguments[0] }

        // Act
        val result = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 42L)
        
        // Assert
        // Kun én bruker skal få tildeling
        assertEquals(1, result.allocations.size)
        
        // Statistikk skal vise at én bruker ikke fikk noe
        assertTrue(result.statistics.participantsWithZeroAllocations == 1 ||
                   result.statistics.participantsWithOneAllocation == 2)
    }

    @Test
    fun `test user never gets same period twice even with multiple wishes for same period`() {
        // Test at en bruker som ønsker samme periode med forskjellige enheter
        // kun får perioden maksimalt én gang

        // Arrange
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "TEST_2025",
            status = DrawingStatus.LOCKED
        )

        val user1 = User(id = 1L, email = "user1@jpro.no", name = "User 1", givenName = "User", familyName = "One", budgets = emptyList())
        val user2 = User(id = 2L, email = "user2@jpro.no", name = "User 2", givenName = "User", familyName = "Two", budgets = emptyList())

        val hovedhytta = Apartment(id = 1L, cabin_name = "Hovedhytta", sort_order = 1)
        val leiligheten = Apartment(id = 2L, cabin_name = "Leiligheten", sort_order = 2)
        val annekset = Apartment(id = 3L, cabin_name = "Annekset", sort_order = 3)

        val period1 = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 4, 1),
            endDate = LocalDate.of(2025, 4, 8),
            description = "Påske",
            sortOrder = 1
        )

        val period2 = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 2, 18),
            endDate = LocalDate.of(2025, 2, 25),
            description = "Vinterferie",
            sortOrder = 2
        )

        // User 1 ønsker Påske med BÅDE Hovedhytta (prioritet 1) og Leiligheten (prioritet 2)
        // User 1 ønsker også Vinterferie med Annekset (prioritet 3)
        val user1Wishes = listOf(
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = user1,
                period = period1, // Påske
                priority = 1,
                desiredApartments = listOf(hovedhytta, leiligheten) // Ønsker begge enheter
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = user1,
                period = period1, // Påske igjen! (men annen enhet)
                priority = 2,
                desiredApartments = listOf(leiligheten, annekset)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = user1,
                period = period2, // Vinterferie
                priority = 3,
                desiredApartments = listOf(annekset)
            )
        )

        // User 2 ønsker noe annet for å ikke kollidere helt
        val user2Wishes = listOf(
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = user2,
                period = period2, // Vinterferie
                priority = 1,
                desiredApartments = listOf(hovedhytta)
            )
        )

        // Mock repositories
        `when`(drawingRepository.findById(drawingId)).thenReturn(Optional.of(drawing))
        `when`(wishRepository.findDistinctUsersByDrawing(drawing)).thenReturn(listOf(user1, user2))
        `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, user1))
            .thenReturn(user1Wishes)
        `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, user2))
            .thenReturn(user2Wishes)
        `when`(executionRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { invocation ->
                val execution = invocation.arguments[0] as CabinDrawingExecution
                execution.copy(id = UUID.randomUUID())
            }
        `when`(allocationRepository.saveAll(org.mockito.ArgumentMatchers.anyList()))
            .thenAnswer { it.arguments[0] }
        `when`(drawingRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { it.arguments[0] }

        // Act
        val result = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 42L)

        // Assert - Dette er det viktigste: ingen bruker skal få samme periode mer enn én gang
        val user1Allocations = result.allocations.filter { it.userId == 1L }
        val user1Periods = user1Allocations.map { it.periodId }.toSet()

        assertEquals(user1Periods.size, user1Allocations.size,
            "User 1 fikk samme periode flere ganger! Perioder: $user1Periods, Tildelinger: ${user1Allocations.size}")

        // Verifiser at user1 maksimalt har fått Påske én gang (ikke både Hovedhytta OG Leiligheten i Påske)
        val user1PåskeAllocations = user1Allocations.filter { it.periodId == period1.id }
        assertTrue(user1PåskeAllocations.size <= 1,
            "User 1 fikk Påske-perioden ${user1PåskeAllocations.size} ganger, skal være maks 1. " +
            "Enheter: ${user1PåskeAllocations.map { it.apartmentName }}")

        // Verifiser også for user2
        val user2Allocations = result.allocations.filter { it.userId == 2L }
        val user2Periods = user2Allocations.map { it.periodId }.toSet()

        assertEquals(user2Periods.size, user2Allocations.size,
            "User 2 fikk samme periode flere ganger!")

        // Verifiser at audit log ble generert
        assertTrue(result.auditLog.isNotEmpty(), "Audit log skal inneholde informasjon om trekningsprosessen")
    }
}
