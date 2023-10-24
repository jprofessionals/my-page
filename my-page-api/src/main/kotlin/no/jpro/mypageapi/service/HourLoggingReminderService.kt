package no.jpro.mypageapi.service

import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class HourLoggingReminderService {

    /**
     * Den vanligste metoden for å beregne påsken i den vestlige verden (som inkluderer de fleste protestantiske og
     * katolske kirker) er kjent som "Computus", denne algoritmen fungerer for årene 1583 til 4099, som dekker den
     * gregorianske kalenderens varighet. Dette er den kalenderen som i dag er i vanlig bruk i store deler av verden.
     */
    fun computeEaster(year: Int): LocalDate {
        val yearMod19 = year % 19
        val century = year / 100
        val yearOfCentury = year % 100
        val centuryDiv4 = century / 4
        val centuryMod4 = century % 4
        val specialLeapYear = (century + 8) / 25
        val nonLeapYear = (century - specialLeapYear + 1) / 3
        val moonPhase = (19 * yearMod19 + century - centuryDiv4 - nonLeapYear + 15) % 30
        val sundayCount = yearOfCentury / 4
        val yearOfCenturyMod4 = yearOfCentury % 4
        val correctionFactor = (32 + 2 * centuryMod4 + 2 * sundayCount - moonPhase - yearOfCenturyMod4) % 7
        val marchCorrection = (yearMod19 + 11 * moonPhase + 22 * correctionFactor) / 451
        val month = (moonPhase + correctionFactor - 7 * marchCorrection + 114) / 31
        val day = ((moonPhase + correctionFactor - 7 * marchCorrection + 114) % 31) + 1
        return LocalDate.of(year, month, day)
    }

    fun computePalmSunday(year: Int): LocalDate {
        return computeEaster(year).minusDays(7)
    }




}