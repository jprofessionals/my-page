package no.jpro.mypageapi.integration.ktu

import no.jpro.mypageapi.entity.ktu.KtuColorTheme
import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.model.CreateKtuColorTheme
import no.jpro.mypageapi.model.UpdateKtuColorTheme
import no.jpro.mypageapi.repository.KtuColorThemeRepository
import no.jpro.mypageapi.repository.KtuRoundRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

class KtuColorThemeTest(
    @Autowired private val colorThemeRepository: KtuColorThemeRepository,
    @Autowired private val roundRepository: KtuRoundRepository,
) : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        roundRepository.deleteAll()  // Must delete rounds first due to FK constraint
        colorThemeRepository.deleteAll()
    }

    @Nested
    inner class CreateColorTheme {
        @Test
        fun `should create color theme as admin`() {
            // Arrange
            val createRequest = CreateKtuColorTheme(
                name = "Blå tema",
                headerBgColor = "#003366",
                primaryColor = "#0066CC",
                accentBgColor = "#E6F0FF",
                isDefault = false
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .postForEntity<no.jpro.mypageapi.model.KtuColorTheme>(
                    "/ktu/color-themes",
                    createRequest
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
            val theme = response.body!!
            assertThat(theme.name).isEqualTo("Blå tema")
            assertThat(theme.headerBgColor).isEqualTo("#003366")
            assertThat(theme.primaryColor).isEqualTo("#0066CC")
            assertThat(theme.accentBgColor).isEqualTo("#E6F0FF")
            assertThat(theme.isDefault).isFalse()
        }

        @Test
        fun `should reject color theme creation without admin rights`() {
            // Arrange
            val createRequest = CreateKtuColorTheme(
                name = "Blå tema",
                headerBgColor = "#003366",
                primaryColor = "#0066CC",
                accentBgColor = "#E6F0FF"
            )

            // Act
            val response = restClient(true, asAdmin = false)
                .postForEntity<String>(
                    "/ktu/color-themes",
                    createRequest
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
        }
    }

    @Nested
    inner class GetColorThemes {
        @Test
        fun `should get all color themes`() {
            // Arrange
            colorThemeRepository.save(
                KtuColorTheme(
                    name = "Standard",
                    headerBgColor = "#1a1a1a",
                    primaryColor = "#4F46E5",
                    accentBgColor = "#F5F5F5",
                    isDefault = true
                )
            )
            colorThemeRepository.save(
                KtuColorTheme(
                    name = "Grønn",
                    headerBgColor = "#006633",
                    primaryColor = "#009944",
                    accentBgColor = "#E6FFE6"
                )
            )

            // Act
            val response = restClient(true)
                .exchange(
                    "/ktu/color-themes",
                    HttpMethod.GET,
                    null,
                    object : ParameterizedTypeReference<List<no.jpro.mypageapi.model.KtuColorTheme>>() {}
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val themes = response.body!!
            assertThat(themes).hasSize(2)
        }

        @Test
        fun `should get single color theme by id`() {
            // Arrange
            val savedTheme = colorThemeRepository.save(
                KtuColorTheme(
                    name = "Standard",
                    headerBgColor = "#1a1a1a",
                    primaryColor = "#4F46E5",
                    accentBgColor = "#F5F5F5"
                )
            )

            // Act
            val response = restClient(true)
                .getForEntity<no.jpro.mypageapi.model.KtuColorTheme>("/ktu/color-themes/${savedTheme.id}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val theme = response.body!!
            assertThat(theme.id).isEqualTo(savedTheme.id)
            assertThat(theme.name).isEqualTo("Standard")
        }

        @Test
        fun `should return 404 for non-existent color theme`() {
            // Act
            val response = restClient(true)
                .getForEntity<String>("/ktu/color-themes/99999")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        }
    }

    @Nested
    inner class UpdateColorTheme {
        @Test
        fun `should update color theme as admin`() {
            // Arrange
            val savedTheme = colorThemeRepository.save(
                KtuColorTheme(
                    name = "Standard",
                    headerBgColor = "#1a1a1a",
                    primaryColor = "#4F46E5",
                    accentBgColor = "#F5F5F5"
                )
            )

            val updateRequest = UpdateKtuColorTheme(
                name = "Standard Oppdatert",
                primaryColor = "#6366F1"
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .putForEntity<no.jpro.mypageapi.model.KtuColorTheme>(
                    "/ktu/color-themes/${savedTheme.id}",
                    updateRequest
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val theme = response.body!!
            assertThat(theme.name).isEqualTo("Standard Oppdatert")
            assertThat(theme.primaryColor).isEqualTo("#6366F1")
            // Other fields should remain unchanged
            assertThat(theme.headerBgColor).isEqualTo("#1a1a1a")
        }
    }

    @Nested
    inner class DeleteColorTheme {
        @Test
        fun `should delete color theme as admin`() {
            // Arrange
            val savedTheme = colorThemeRepository.save(
                KtuColorTheme(
                    name = "Slett meg",
                    headerBgColor = "#1a1a1a",
                    primaryColor = "#4F46E5",
                    accentBgColor = "#F5F5F5"
                )
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .delete<String>("/ktu/color-themes/${savedTheme.id}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
            assertThat(colorThemeRepository.findById(savedTheme.id!!)).isEmpty
        }

        @Test
        fun `should not delete color theme that is in use by a round`() {
            // Arrange
            val savedTheme = colorThemeRepository.save(
                KtuColorTheme(
                    name = "I bruk",
                    headerBgColor = "#1a1a1a",
                    primaryColor = "#4F46E5",
                    accentBgColor = "#F5F5F5"
                )
            )

            // Create a round that uses this theme
            roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2025",
                    year = 2025,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.DRAFT,
                    colorTheme = savedTheme
                )
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .delete<String>("/ktu/color-themes/${savedTheme.id}")

            // Assert - Should fail because theme is in use
            assertThat(response.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        }
    }
}
