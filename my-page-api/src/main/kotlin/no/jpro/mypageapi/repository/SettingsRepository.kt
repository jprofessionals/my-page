package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Setting
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SettingsRepository : JpaRepository<Setting, String> {
    fun findSettingBySettingId(settingId: String): Setting?
}