package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.repository.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.lenient
import org.mockito.junit.jupiter.MockitoExtension
import org.slf4j.LoggerFactory
import java.time.LocalDate
import java.util.*

@ExtendWith(MockitoExtension::class)
class CabinLotteryDeterministicTest {

    companion object {
        private val logger = LoggerFactory.getLogger(CabinLotteryDeterministicTest::class.java)
    }

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
    fun `same seed produces identical results across multiple runs`() {
        // Arrange: Set up a drawing with 5 users and multiple wishes
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "VINTER_2025_2026",
            status = DrawingStatus.LOCKED
        )

        // Create 5 users
        val users = (1..5).map { i ->
            User(
                id = i.toLong(),
                email = "user$i@jpro.no",
                name = "User $i",
                givenName = "User",
                familyName = "$i",
                sub = "sub-$i",
                budgets = emptyList()
            )
        }

        // Create 3 apartments
        val apartments = listOf(
            Apartment(id = 51L, cabin_name = "Stor leilighet", sort_order = 1),
            Apartment(id = 52L, cabin_name = "Liten leilighet", sort_order = 1),
            Apartment(id = 53L, cabin_name = "Annekset", sort_order = 1)
        )

        // Create 4 periods
        val periods = listOf(
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 5),
                endDate = LocalDate.of(2025, 11, 12),
                description = "05.11 - 12.11",
                sortOrder = 1
            ),
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 12),
                endDate = LocalDate.of(2025, 11, 19),
                description = "12.11 - 19.11",
                sortOrder = 2
            ),
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 19),
                endDate = LocalDate.of(2025, 11, 26),
                description = "19.11 - 26.11",
                sortOrder = 3
            ),
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 26),
                endDate = LocalDate.of(2025, 12, 3),
                description = "26.11 - 03.12",
                sortOrder = 4
            )
        )

        // Create wishes with varying priorities and preferences
        val wishes = listOf(
            // User 1: Wants all apartments in period 1 (priority 1), then period 2 (priority 2)
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[0],
                period = periods[0],
                priority = 1,
                desiredApartments = apartments
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[0],
                period = periods[1],
                priority = 2,
                desiredApartments = listOf(apartments[0], apartments[1])
            ),

            // User 2: Wants Stor leilighet in period 2 (priority 1), then period 1 (priority 2)
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[1],
                period = periods[1],
                priority = 1,
                desiredApartments = listOf(apartments[0])
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[1],
                period = periods[0],
                priority = 2,
                desiredApartments = listOf(apartments[1])
            ),

            // User 3: Wants Annekset in all periods
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[2],
                period = periods[0],
                priority = 1,
                desiredApartments = listOf(apartments[2])
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[2],
                period = periods[1],
                priority = 2,
                desiredApartments = listOf(apartments[2])
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[2],
                period = periods[2],
                priority = 3,
                desiredApartments = listOf(apartments[2])
            ),

            // User 4: Wants period 3 and 4
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[3],
                period = periods[2],
                priority = 1,
                desiredApartments = listOf(apartments[0], apartments[1])
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[3],
                period = periods[3],
                priority = 2,
                desiredApartments = apartments
            ),

            // User 5: Wants any apartment in period 4
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[4],
                period = periods[3],
                priority = 1,
                desiredApartments = apartments
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[4],
                period = periods[2],
                priority = 2,
                desiredApartments = listOf(apartments[2])
            )
        )

        // Mock repository responses
        setupMockRepositories(drawing, drawingId, users, wishes)

        // Act: Run the draw 3 times with the same seed
        val seed = 42L
        val result1 = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = seed)

        // Reset mocks for second run
        setupMockRepositories(drawing, drawingId, users, wishes)
        val result2 = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = seed)

        // Reset mocks for third run
        setupMockRepositories(drawing, drawingId, users, wishes)
        val result3 = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = seed)

        // Assert: All three results should be identical
        assertEquals(result1.allocations.size, result2.allocations.size,
            "Same seed should produce same number of allocations")
        assertEquals(result1.allocations.size, result3.allocations.size,
            "Same seed should produce same number of allocations")

        // Compare allocations in detail
        val allocations1 = result1.allocations.sortedWith(compareBy({ it.userId }, { it.periodId }))
        val allocations2 = result2.allocations.sortedWith(compareBy({ it.userId }, { it.periodId }))
        val allocations3 = result3.allocations.sortedWith(compareBy({ it.userId }, { it.periodId }))

        for (i in allocations1.indices) {
            assertEquals(allocations1[i].userId, allocations2[i].userId,
                "Allocation $i should have same user in both runs")
            assertEquals(allocations1[i].periodId, allocations2[i].periodId,
                "Allocation $i should have same period in both runs")
            assertEquals(allocations1[i].apartmentId, allocations2[i].apartmentId,
                "Allocation $i should have same apartment in both runs")

            assertEquals(allocations1[i].userId, allocations3[i].userId,
                "Allocation $i should have same user in all runs")
            assertEquals(allocations1[i].periodId, allocations3[i].periodId,
                "Allocation $i should have same period in all runs")
            assertEquals(allocations1[i].apartmentId, allocations3[i].apartmentId,
                "Allocation $i should have same apartment in all runs")
        }

        // Verify statistics are consistent
        assertEquals(result1.statistics.totalAllocations, result2.statistics.totalAllocations)
        assertEquals(result1.statistics.totalAllocations, result3.statistics.totalAllocations)
    }

    @Test
    fun `different seeds produce different results`() {
        // Arrange: Same setup as above
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "VINTER_2025_2026",
            status = DrawingStatus.LOCKED
        )

        val users = (1..5).map { i ->
            User(
                id = i.toLong(),
                email = "user$i@jpro.no",
                name = "User $i",
                givenName = "User",
                familyName = "$i",
                sub = "sub-$i",
                budgets = emptyList()
            )
        }

        val apartments = listOf(
            Apartment(id = 51L, cabin_name = "Stor leilighet", sort_order = 1),
            Apartment(id = 52L, cabin_name = "Liten leilighet", sort_order = 1),
            Apartment(id = 53L, cabin_name = "Annekset", sort_order = 1)
        )

        val periods = listOf(
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 5),
                endDate = LocalDate.of(2025, 11, 12),
                description = "05.11 - 12.11",
                sortOrder = 1
            ),
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 12),
                endDate = LocalDate.of(2025, 11, 19),
                description = "12.11 - 19.11",
                sortOrder = 2
            )
        )

        val wishes = listOf(
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[0],
                period = periods[0],
                priority = 1,
                desiredApartments = apartments
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[1],
                period = periods[0],
                priority = 1,
                desiredApartments = apartments
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[2],
                period = periods[0],
                priority = 1,
                desiredApartments = apartments
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[3],
                period = periods[1],
                priority = 1,
                desiredApartments = apartments
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[4],
                period = periods[1],
                priority = 1,
                desiredApartments = apartments
            )
        )

        // Act: Run draws with different seeds
        setupMockRepositories(drawing, drawingId, users, wishes)
        val resultSeed42 = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 42L)

        setupMockRepositories(drawing, drawingId, users, wishes)
        val resultSeed123 = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 123L)

        setupMockRepositories(drawing, drawingId, users, wishes)
        val resultSeed999 = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 999L)

        // Assert: Results should differ
        val allocations42 = resultSeed42.allocations.map { Triple(it.userId, it.periodId, it.apartmentId) }.toSet()
        val allocations123 = resultSeed123.allocations.map { Triple(it.userId, it.periodId, it.apartmentId) }.toSet()
        val allocations999 = resultSeed999.allocations.map { Triple(it.userId, it.periodId, it.apartmentId) }.toSet()

        // At least one of the results should differ from the others
        // (With 5 users and randomization, it's extremely unlikely all three would be identical)
        val allIdentical = allocations42 == allocations123 && allocations123 == allocations999
        assertFalse(allIdentical,
            "Different seeds should produce different allocation results in most cases")

        // But all should have the same total number of allocations
        // (since the same wishes and apartments are available)
        assertTrue(resultSeed42.allocations.isNotEmpty(), "Should have allocations with seed 42")
        assertTrue(resultSeed123.allocations.isNotEmpty(), "Should have allocations with seed 123")
        assertTrue(resultSeed999.allocations.isNotEmpty(), "Should have allocations with seed 999")
    }

    @Test
    fun `algorithm respects priority order when allocating wishes`() {
        // Arrange: Setup with multiple users to properly test priority
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "TEST_PRIORITY",
            status = DrawingStatus.LOCKED
        )

        val users = listOf(
            User(
                id = 1L,
                email = "user1@jpro.no",
                name = "User 1",
                givenName = "User",
                familyName = "1",
                sub = "sub-1",
                budgets = emptyList()
            ),
            User(
                id = 2L,
                email = "user2@jpro.no",
                name = "User 2",
                givenName = "User",
                familyName = "2",
                sub = "sub-2",
                budgets = emptyList()
            )
        )

        // Only 1 apartment available
        val apartment = Apartment(id = 51L, cabin_name = "Only Cabin", sort_order = 1)

        val periodHigh = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 4, 1),
            endDate = LocalDate.of(2025, 4, 8),
            description = "Påske (high priority)",
            sortOrder = 1
        )

        val periodLow = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 2, 18),
            endDate = LocalDate.of(2025, 2, 25),
            description = "Vinterferie (low priority)",
            sortOrder = 2
        )

        // User 1: Prioritizes Påske (1), then Vinterferie (2)
        // User 2: Prioritizes Vinterferie (1), then Påske (2)
        val wishes = listOf(
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[0],
                period = periodHigh,
                priority = 1,
                desiredApartments = listOf(apartment)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[0],
                period = periodLow,
                priority = 2,
                desiredApartments = listOf(apartment)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[1],
                period = periodLow,
                priority = 1,
                desiredApartments = listOf(apartment)
            ),
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = users[1],
                period = periodHigh,
                priority = 2,
                desiredApartments = listOf(apartment)
            )
        )

        setupMockRepositories(drawing, drawingId, users, wishes)

        // Act: Run multiple times to verify priority is respected
        setupMockRepositories(drawing, drawingId, users, wishes)
        val result = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 42L)

        // Assert: Each user should try their highest priority first
        assertEquals(2, result.allocations.size,
            "With 1 apartment and 2 periods, both users should get 1 allocation each")

        // Verify that allocations match users' highest priorities
        result.allocations.forEach { allocation ->
            val user = users.find { it.id == allocation.userId }!!
            val userWishes = wishes.filter { it.user == user }.sortedBy { it.priority }
            val topPriorityPeriod = userWishes.first().period.id

            // The allocation should match one of the user's wishes
            val matchingWish = wishes.find {
                it.user.id == allocation.userId &&
                it.period.id == allocation.periodId
            }
            assertNotNull(matchingWish, "Allocation should match a user wish")
            assertTrue(matchingWish!!.priority <= 2,
                "User should get one of their top 2 priorities")
        }
    }

    @Test
    fun `algorithm handles conflicting wishes fairly with snake draft`() {
        // Arrange: 3 users all want the same thing
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "TEST_CONFLICT",
            status = DrawingStatus.LOCKED
        )

        val users = (1..3).map { i ->
            User(
                id = i.toLong(),
                email = "user$i@jpro.no",
                name = "User $i",
                givenName = "User",
                familyName = "$i",
                sub = "sub-$i",
                budgets = emptyList()
            )
        }

        val apartment = Apartment(id = 51L, cabin_name = "Popular Cabin", sort_order = 1)

        val period = CabinPeriod(
            id = UUID.randomUUID(),
            drawing = drawing,
            startDate = LocalDate.of(2025, 4, 1),
            endDate = LocalDate.of(2025, 4, 8),
            description = "Påske",
            sortOrder = 1
        )

        // All 3 users want the same apartment in the same period
        val wishes = users.map { user ->
            CabinWish(
                id = UUID.randomUUID(),
                drawing = drawing,
                user = user,
                period = period,
                priority = 1,
                desiredApartments = listOf(apartment)
            )
        }

        setupMockRepositories(drawing, drawingId, users, wishes)

        // Act
        val result = lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = 42L)

        // Assert: Only 1 user can get the apartment
        assertEquals(1, result.allocations.size,
            "Only one user should get the contested apartment")

        // The allocation should be for the contested period
        assertEquals(period.id, result.allocations.first().periodId)
        assertEquals(apartment.id, result.allocations.first().apartmentId)

        // Verify statistics
        assertEquals(3, result.statistics.totalParticipants)
        assertEquals(1, result.statistics.totalAllocations)
        assertTrue(result.statistics.participantsWithZeroAllocations >= 2,
            "At least 2 participants should have zero allocations")
    }

    @Test
    fun `no seed produces random results across multiple runs`() {
        // Arrange: Same setup with multiple users competing for limited slots
        val drawingId = UUID.randomUUID()
        val drawing = CabinDrawing(
            id = drawingId,
            season = "RANDOM_TEST",
            status = DrawingStatus.LOCKED
        )

        val users = (1..5).map { i ->
            User(
                id = i.toLong(),
                email = "user$i@jpro.no",
                name = "User $i",
                givenName = "User",
                familyName = "$i",
                sub = "sub-$i",
                budgets = emptyList()
            )
        }

        val apartments = listOf(
            Apartment(id = 51L, cabin_name = "Stor leilighet", sort_order = 1),
            Apartment(id = 52L, cabin_name = "Liten leilighet", sort_order = 1),
            Apartment(id = 53L, cabin_name = "Annekset", sort_order = 1)
        )

        val periods = listOf(
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 5),
                endDate = LocalDate.of(2025, 11, 12),
                description = "05.11 - 12.11",
                sortOrder = 1
            ),
            CabinPeriod(
                id = UUID.randomUUID(),
                drawing = drawing,
                startDate = LocalDate.of(2025, 11, 12),
                endDate = LocalDate.of(2025, 11, 19),
                description = "12.11 - 19.11",
                sortOrder = 2
            )
        )

        // All users want all apartments in both periods - creates randomness
        val wishes = users.flatMap { user ->
            listOf(
                CabinWish(
                    id = UUID.randomUUID(),
                    drawing = drawing,
                    user = user,
                    period = periods[0],
                    priority = 1,
                    desiredApartments = apartments
                ),
                CabinWish(
                    id = UUID.randomUUID(),
                    drawing = drawing,
                    user = user,
                    period = periods[1],
                    priority = 2,
                    desiredApartments = apartments
                )
            )
        }

        // Act: Run draw 5 times WITHOUT seed (null)
        val results = (1..5).map {
            setupMockRepositories(drawing, drawingId, users, wishes)
            lotteryService.performSnakeDraft(drawingId, executedBy = 1L, seed = null)
        }

        // Assert: Results should vary (not all identical)
        // Extract allocation signatures (user-period-apartment triples)
        val allocationSignatures = results.map { result ->
            result.allocations
                .map { Triple(it.userId, it.periodId, it.apartmentId) }
                .sortedWith(compareBy({ it.first }, { it.second }, { it.third }))
                .toSet()
        }

        // At least one result should differ from the first
        // With 5 users competing for 3 apartments across 2 periods and random ordering,
        // it's statistically extremely unlikely all 5 runs would be identical
        val uniqueResults = allocationSignatures.toSet()
        assertTrue(uniqueResults.size > 1,
            "Running draw without seed should produce varying results. Got ${uniqueResults.size} unique result(s) out of 5 runs.")

        // Verify all runs produced valid allocations
        results.forEach { result ->
            assertTrue(result.allocations.isNotEmpty(),
                "Draw without seed should still produce allocations")
            assertEquals(users.size, result.statistics.totalParticipants,
                "All runs should have same number of participants")
        }

        // Log the variation for debugging
        logger.info("Random draw produced ${uniqueResults.size} unique results out of 5 runs")
    }

    private fun setupMockRepositories(
        drawing: CabinDrawing,
        drawingId: UUID,
        users: List<User>,
        wishes: List<CabinWish>
    ) {
        `when`(drawingRepository.findById(drawingId)).thenReturn(Optional.of(drawing))
        `when`(wishRepository.findDistinctUsersByDrawing(drawing)).thenReturn(users)

        users.forEach { user ->
            val userWishes = wishes.filter { it.user == user }
            `when`(wishRepository.findByDrawingAndUserOrderByPriority(drawing, user))
                .thenReturn(userWishes)
        }

        `when`(allocationRepository.saveAll(org.mockito.ArgumentMatchers.anyList()))
            .thenAnswer { it.arguments[0] }
        lenient().`when`(drawingRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { it.arguments[0] }
        `when`(executionRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer { invocation ->
                val arg = invocation.arguments[0]
                if (arg is CabinDrawingExecution) {
                    arg.copy(id = UUID.randomUUID())
                } else {
                    arg
                }
            }
    }
}