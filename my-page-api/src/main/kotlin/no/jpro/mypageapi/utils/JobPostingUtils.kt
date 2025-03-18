package no.jpro.mypageapi.utils

import no.jpro.mypageapi.entity.JobPosting
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

object JobPostingUtils {
    fun getDeadlineText(jobPosting: JobPosting): String {
        return if (jobPosting.urgent) {
            "ASAP"
        } else {
            jobPosting.deadline
                ?.atZoneSameInstant(ZoneId.of("Europe/Oslo"))
                ?.format(
                    DateTimeFormatter.ofPattern(
                        "dd. MMMM yyyy HH:mm",
                        Locale.forLanguageTag("no-NO")
                    )
                ) ?: "Ingen frist"
        }
    }
}
