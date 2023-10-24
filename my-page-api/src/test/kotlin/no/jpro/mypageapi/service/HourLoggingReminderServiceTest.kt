package no.jpro.mypageapi.service

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import java.time.LocalDate

class HourLoggingReminderServiceTest {

    @Test
    fun testPalmSunday() {

        val hourLoggingReminderService = HourLoggingReminderService()

        val testCases = listOf(
            Pair(2023, LocalDate.of(2023, 4, 2)),
            Pair(2024, LocalDate.of(2024, 3, 24)),
            Pair(2025, LocalDate.of(2025, 4, 13)),
            Pair(2026, LocalDate.of(2026, 3, 29)),
            Pair(2027, LocalDate.of(2027, 3, 21)),
            Pair(2028, LocalDate.of(2028, 4, 9)),
            Pair(2029, LocalDate.of(2029, 3, 25)),
            Pair(2030, LocalDate.of(2030, 4, 14)),
            Pair(2031, LocalDate.of(2031, 4, 6)),
            Pair(2032, LocalDate.of(2032, 3, 21)),
            Pair(2033, LocalDate.of(2033, 4, 10)),

            /*
            Søndag 1. januar: 1. nyttårsdag
        Mandag 1. mai: Offentlig høytidsdag
        Onsdag 17. mai: Grunnlovsdag

        Mandag 25. desember: 1. juledag
        Tirsdag 26. desember: 2. juledag




        Søndag 2. april: Palmesøndag
        Torsdag 6. april: Skjærtorsdag
        Fredag 7. april: Langfredag
        Søndag 9. april: 1. påskedag
        Mandag 10. april: 2. påskedag

        Torsdag 18. mai: Kristi Himmelfartsdag

        Søndag 28. mai: 1. pinsedag
        Mandag 29. mai: 2. pinsedag

batch første i hver måned


for hver måned
dersom siste arbeidsdag er kirkelig helligdag:
	finn siste arbeidsdag (man-fre) før kirkelig helligdag

	rekursér bakover (siste dag i måneden er lørdag eller søndag)


siste dag i måneden er lørdag eller søndag
fredag

ellers siste dag i måneden


*/


        )

        for (testCase in testCases) {
            val year = testCase.first
            val expectedDate = testCase.second
            val computedDate = hourLoggingReminderService.computePalmSunday(year)

            Assertions.assertEquals(expectedDate, computedDate, "Failed for year $year")
        }
    }

}

