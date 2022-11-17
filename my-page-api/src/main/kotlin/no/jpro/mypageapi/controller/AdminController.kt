package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.service.AdminService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("admin")
@SecurityRequirement(name = "Bearer Authentication")
class AdminController(
    private val adminService: AdminService
) {

    @GetMapping("summary")
    @Operation(summary = "Get list of all users and all budgets")
    @ApiResponse(
        responseCode = "200",
        content = [Content(mediaType = "application/json", schema = Schema(implementation = UserTable::class))]
    )
    @RequiresAdmin
    fun getSummary(): UserTable =
        adminService.getSummary()

}
