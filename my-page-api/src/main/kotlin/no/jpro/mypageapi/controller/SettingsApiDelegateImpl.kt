package no.jpro.mypageapi.controller

import no.jpro.mypageapi.api.SettingsApiDelegate
import no.jpro.mypageapi.model.Setting as SettingModel
import no.jpro.mypageapi.entity.Setting as SettingEntity
import no.jpro.mypageapi.service.SettingsService
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.context.request.NativeWebRequest
import java.util.*

@Service
class SettingsApiDelegateImpl(
    private val settingsService: SettingsService,
    private val request: Optional<NativeWebRequest>
) : SettingsApiDelegate {

    override fun getRequest(): Optional<NativeWebRequest> = request

    override fun getSettings(): ResponseEntity<List<SettingModel>> {
        val settings = settingsService.getAllSettings()
        val settingModels = settings.map { toModel(it) }
        return ResponseEntity.ok(settingModels)
    }

    override fun getSetting(settingId: String): ResponseEntity<SettingModel> {
        val setting = settingsService.getSetting(settingId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toModel(setting))
    }

    override fun updateSetting(settingId: String, setting: SettingModel): ResponseEntity<SettingModel> {
        val entity = toEntity(setting)
        val updatedSetting = settingsService.updateSetting(entity) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toModel(updatedSetting))
    }

    private fun toModel(entity: SettingEntity): SettingModel {
        return SettingModel(
            settingId = entity.settingId,
            settingValue = entity.settingValue,
            settingDescription = entity.description
        )
    }

    private fun toEntity(model: SettingModel): SettingEntity {
        return SettingEntity(
            settingId = model.settingId,
            settingValue = model.settingValue,
            description = model.settingDescription ?: "",
            priority = 0
        )
    }
}