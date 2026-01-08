package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.ktu.KtuColorTheme
import no.jpro.mypageapi.repository.KtuColorThemeRepository
import no.jpro.mypageapi.repository.KtuRoundRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime

@Service
class KtuColorThemeService(
    private val colorThemeRepository: KtuColorThemeRepository,
    private val roundRepository: KtuRoundRepository
) {

    fun getAllThemes(): List<KtuColorTheme> {
        return colorThemeRepository.findAll()
    }

    fun getThemeById(id: Long): KtuColorTheme? {
        return colorThemeRepository.findById(id).orElse(null)
    }

    fun getDefaultTheme(): KtuColorTheme? {
        return colorThemeRepository.findByIsDefault(true)
    }

    @Transactional
    fun createTheme(
        name: String,
        headerBgColor: String,
        primaryColor: String,
        accentBgColor: String,
        isDefault: Boolean = false
    ): KtuColorTheme {
        // Validate name uniqueness
        if (colorThemeRepository.existsByName(name)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Et tema med navnet '$name' eksisterer allerede")
        }

        // If this theme is set as default, remove default from others
        if (isDefault) {
            clearDefaultTheme()
        }

        val theme = KtuColorTheme(
            name = name,
            headerBgColor = headerBgColor,
            primaryColor = primaryColor,
            accentBgColor = accentBgColor,
            isDefault = isDefault,
            createdAt = LocalDateTime.now()
        )

        return colorThemeRepository.save(theme)
    }

    @Transactional
    fun updateTheme(
        id: Long,
        name: String?,
        headerBgColor: String?,
        primaryColor: String?,
        accentBgColor: String?,
        isDefault: Boolean?
    ): KtuColorTheme {
        val theme = colorThemeRepository.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Tema ikke funnet")
        }

        // Validate name uniqueness if changed
        if (name != null && name != theme.name && colorThemeRepository.existsByName(name)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Et tema med navnet '$name' eksisterer allerede")
        }

        // If setting this theme as default, remove default from others
        if (isDefault == true && !theme.isDefault) {
            clearDefaultTheme()
        }

        val updated = theme.copy(
            name = name ?: theme.name,
            headerBgColor = headerBgColor ?: theme.headerBgColor,
            primaryColor = primaryColor ?: theme.primaryColor,
            accentBgColor = accentBgColor ?: theme.accentBgColor,
            isDefault = isDefault ?: theme.isDefault
        )

        return colorThemeRepository.save(updated)
    }

    @Transactional
    fun deleteTheme(id: Long) {
        val theme = colorThemeRepository.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Tema ikke funnet")
        }

        // Check if theme is in use
        if (roundRepository.existsByColorThemeId(id)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Kan ikke slette tema som er i bruk")
        }

        // Don't allow deleting the default theme if it's the only one
        if (theme.isDefault && colorThemeRepository.count() <= 1) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Kan ikke slette det eneste temaet")
        }

        colorThemeRepository.delete(theme)
    }

    private fun clearDefaultTheme() {
        val currentDefault = colorThemeRepository.findByIsDefault(true)
        if (currentDefault != null) {
            colorThemeRepository.save(currentDefault.copy(isDefault = false))
        }
    }
}
