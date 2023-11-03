package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.Setting
import no.jpro.mypageapi.repository.SettingsRepository
import org.springframework.stereotype.Service


@Service
class SettingsService(
    private val settingsRepository: SettingsRepository
) {

    fun getAllSettings(): List<Setting> = settingsRepository.findAll()

    fun getSetting(settingId: String): Setting? = settingsRepository.findSettingBySettingId(settingId)

    fun updateSetting(updatedSetting: Setting): Setting? {
        val existingSetting = getSetting(updatedSetting.settingId) ?: return null

        return settingsRepository.save(
            existingSetting.copy(
                settingId = existingSetting.settingId,
                priority = existingSetting.priority,
                description = existingSetting.description,
                settingValue = updatedSetting.settingValue))
    }

}
