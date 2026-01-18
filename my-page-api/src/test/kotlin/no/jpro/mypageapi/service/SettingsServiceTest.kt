package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.Setting
import no.jpro.mypageapi.repository.SettingsRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*

@ExtendWith(MockitoExtension::class)
class SettingsServiceTest {

    @Mock
    private lateinit var settingsRepository: SettingsRepository

    private lateinit var settingsService: SettingsService

    @BeforeEach
    fun setup() {
        settingsService = SettingsService(settingsRepository)
    }

    @Nested
    inner class GetAllSettings {

        @Test
        fun `should return all settings`() {
            // Arrange
            val settings = listOf(
                Setting(settingId = "setting1", priority = 1, description = "Setting 1", settingValue = "value1"),
                Setting(settingId = "setting2", priority = 2, description = "Setting 2", settingValue = "value2")
            )
            whenever(settingsRepository.findAll()).thenReturn(settings)

            // Act
            val result = settingsService.getAllSettings()

            // Assert
            assertEquals(2, result.size)
            assertEquals("setting1", result[0].settingId)
            assertEquals("setting2", result[1].settingId)
        }

        @Test
        fun `should return empty list when no settings exist`() {
            // Arrange
            whenever(settingsRepository.findAll()).thenReturn(emptyList())

            // Act
            val result = settingsService.getAllSettings()

            // Assert
            assertTrue(result.isEmpty())
        }
    }

    @Nested
    inner class GetSetting {

        @Test
        fun `should return setting by id`() {
            // Arrange
            val setting = Setting(
                settingId = "my-setting",
                priority = 1,
                description = "My Setting",
                settingValue = "some-value"
            )
            whenever(settingsRepository.findSettingBySettingId("my-setting")).thenReturn(setting)

            // Act
            val result = settingsService.getSetting("my-setting")

            // Assert
            assertNotNull(result)
            assertEquals("my-setting", result?.settingId)
            assertEquals("some-value", result?.settingValue)
        }

        @Test
        fun `should return null when setting not found`() {
            // Arrange
            whenever(settingsRepository.findSettingBySettingId(any())).thenReturn(null)

            // Act
            val result = settingsService.getSetting("non-existent")

            // Assert
            assertNull(result)
        }
    }

    @Nested
    inner class UpdateSetting {

        @Test
        fun `should update setting value while preserving other fields`() {
            // Arrange
            val existingSetting = Setting(
                settingId = "my-setting",
                priority = 5,
                description = "Original description",
                settingValue = "old-value"
            )
            val updateRequest = Setting(
                settingId = "my-setting",
                priority = 999, // Should be ignored
                description = "New description", // Should be ignored
                settingValue = "new-value"
            )

            whenever(settingsRepository.findSettingBySettingId("my-setting")).thenReturn(existingSetting)
            whenever(settingsRepository.save(any<Setting>())).thenAnswer { it.arguments[0] }

            // Act
            val result = settingsService.updateSetting(updateRequest)

            // Assert
            assertNotNull(result)
            assertEquals("my-setting", result?.settingId)
            assertEquals(5, result?.priority) // Should preserve original
            assertEquals("Original description", result?.description) // Should preserve original
            assertEquals("new-value", result?.settingValue) // Should update
        }

        @Test
        fun `should return null when setting to update does not exist`() {
            // Arrange
            val updateRequest = Setting(
                settingId = "non-existent",
                settingValue = "new-value"
            )
            whenever(settingsRepository.findSettingBySettingId("non-existent")).thenReturn(null)

            // Act
            val result = settingsService.updateSetting(updateRequest)

            // Assert
            assertNull(result)
            verify(settingsRepository, never()).save(any())
        }

        @Test
        fun `should call repository save with correct setting`() {
            // Arrange
            val existingSetting = Setting(
                settingId = "test-setting",
                priority = 1,
                description = "Test",
                settingValue = "old"
            )
            val updateRequest = Setting(settingId = "test-setting", settingValue = "new")

            whenever(settingsRepository.findSettingBySettingId("test-setting")).thenReturn(existingSetting)
            whenever(settingsRepository.save(any<Setting>())).thenAnswer { it.arguments[0] }

            // Act
            settingsService.updateSetting(updateRequest)

            // Assert
            verify(settingsRepository).save(argThat<Setting> { setting ->
                setting.settingId == "test-setting" &&
                setting.settingValue == "new"
            })
        }
    }
}
