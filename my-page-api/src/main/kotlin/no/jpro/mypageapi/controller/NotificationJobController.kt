package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import no.jpro.mypageapi.config.RequiresCron
import no.jpro.mypageapi.job.NotificationJob
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequiresCron
@RequestMapping("job")
@Tag(
    name = "Cron Job Trigger",
    description = "Limited to GCP Cron to trigger jobs"
)
@SecurityRequirement(name = "Bearer Authentication")
class NotificationJobController(
    private val notificationJob: NotificationJob,
) {

    @GetMapping("notification")
    @Transactional
    @Operation(summary = "Trigger notification job")
    @ApiResponse(
        responseCode = "200"
    )
    fun triggerNotificationJob(): ResponseEntity<Unit> {
        notificationJob.triggerJob()
        return ResponseEntity.ok().build()
    }

}
