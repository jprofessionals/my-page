package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import no.jpro.mypageapi.config.RequiresAdmin
import no.jpro.mypageapi.entity.Setting
import no.jpro.mypageapi.service.SettingsService
import org.slf4j.LoggerFactory
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


// DEPRECATED: This controller has been migrated to OpenAPI delegate pattern.
// See SettingsApiDelegateImpl.kt for the new implementation.
// @RestController
@RequestMapping("settings")
@SecurityRequirement(name = "Bearer Authentication")
class SettingsController(private val settingsService: SettingsService) {

    private val logger = LoggerFactory.getLogger(SettingsController::class.java)


    @GetMapping
    fun getSettings(): List<Setting> = settingsService.getAllSettings()

    @GetMapping("{settingId}")
    @ApiResponse(
        responseCode = "200",
        description = "Get requested setting",
        content = [Content(schema = Schema(implementation = Setting::class))]
    )
    fun getSetting(@PathVariable("settingId") settingId: String): Setting? =
        settingsService.getSetting(settingId)


    @PatchMapping("{settingId}")
    @RequiresAdmin
    @ApiResponse(
        responseCode = "200",
        description = "Update requested setting to given value",
        content = [Content(schema = Schema(implementation = Setting::class))]
    )
    fun updateSetting(@PathVariable("settingId") settingId: String,
                      @Valid @RequestBody updatedSetting: Setting): Setting? {
        logger.info("Updating setting $settingId to value ${updatedSetting.settingValue}")
        return settingsService.updateSetting(updatedSetting)
    }

}
