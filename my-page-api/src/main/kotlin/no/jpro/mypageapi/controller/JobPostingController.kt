package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.JobPostingApiDelegate
import no.jpro.mypageapi.model.JobPostingResponse
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.time.ZoneOffset

@Service
class JobPostingController : JobPostingApiDelegate {

    override fun getJobPostings(): ResponseEntity<List<JobPostingResponse>> {
        val dto = listOf(
            JobPostingResponse(
                "Software Engineer",
                "NAV",
                OffsetDateTime.of(2024, 10, 9, 12, 0, 0, 0, ZoneOffset.UTC),
                "Vi søker 5 dyktige utviklere med kompetanse i Kotlin og React",
                listOf("Kotlin", "React"),
                emptyList(),
                emptyList(),
                "1"
            ),
            JobPostingResponse(
                "Frontend Developer",
                "Skatteetaten",
                OffsetDateTime.of(2024, 10, 15, 12, 0, 0, 0, ZoneOffset.UTC),
                "Skatteetaten er på jakt etter en dyktig frontend-utvikler med kompetanse i Angular, TypeScript, og Azure",
                listOf("Angular", "TypeScript", "Azure"),
                emptyList(),
                emptyList(),
                "2"
            )
        )

        return ResponseEntity.ok(dto)
    }

}