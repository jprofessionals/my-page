package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.config.RequiresCron
import no.jpro.mypageapi.job.NotificationJob
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequiresCron
@RequestMapping("job/")
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
