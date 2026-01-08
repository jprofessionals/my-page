package no.jpro.mypageapi.integration.ktu

import no.jpro.mypageapi.integration.IntegrationTestBase
import no.jpro.mypageapi.model.CreateKtuRound
import no.jpro.mypageapi.model.KtuRound
import no.jpro.mypageapi.model.KtuRoundStatus
import no.jpro.mypageapi.model.UpdateKtuRound
import no.jpro.mypageapi.repository.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.time.LocalDate

class KtuRoundTest(
    @Autowired private val roundRepository: KtuRoundRepository,
    @Autowired private val colorThemeRepository: KtuColorThemeRepository,
) : IntegrationTestBase() {

    @BeforeEach
    fun setup() {
        roundRepository.deleteAll()
    }

    @Nested
    inner class CreateRound {
        @Test
        fun `should create round as admin`() {
            // Arrange
            val createRequest = CreateKtuRound(
                name = "KTU 2025",
                year = 2025,
                openDate = LocalDate.of(2025, 1, 15),
                closeDate = LocalDate.of(2025, 2, 15)
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .postForEntity<KtuRound>("/ktu/rounds", createRequest)

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
            val round = response.body!!
            assertThat(round.name).isEqualTo("KTU 2025")
            assertThat(round.year).isEqualTo(2025)
            assertThat(round.status).isEqualTo(KtuRoundStatus.DRAFT)
            assertThat(round.openDate).isEqualTo(LocalDate.of(2025, 1, 15))
            assertThat(round.closeDate).isEqualTo(LocalDate.of(2025, 2, 15))
        }

        @Test
        fun `should reject round creation without admin rights`() {
            // Arrange
            val createRequest = CreateKtuRound(
                name = "KTU 2025",
                year = 2025
            )

            // Act
            val response = restClient(true, asAdmin = false)
                .postForEntity<String>("/ktu/rounds", createRequest)

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.FORBIDDEN)
        }
    }

    @Nested
    inner class GetRounds {
        @Test
        fun `should get all rounds`() {
            // Arrange - Create rounds directly in database
            roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2024",
                    year = 2024,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.CLOSED
                )
            )
            roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2025",
                    year = 2025,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.DRAFT
                )
            )

            // Act
            val response = restClient(true)
                .exchange(
                    "/ktu/rounds",
                    HttpMethod.GET,
                    null,
                    object : ParameterizedTypeReference<List<KtuRound>>() {}
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val rounds = response.body!!
            assertThat(rounds).hasSize(2)
        }

        @Test
        fun `should get rounds by status`() {
            // Arrange
            roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2024",
                    year = 2024,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.CLOSED
                )
            )
            roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2025",
                    year = 2025,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.DRAFT
                )
            )

            // Act
            val response = restClient(true)
                .exchange(
                    "/ktu/rounds?status=DRAFT",
                    HttpMethod.GET,
                    null,
                    object : ParameterizedTypeReference<List<KtuRound>>() {}
                )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val rounds = response.body!!
            assertThat(rounds).hasSize(1)
            assertThat(rounds.first().status).isEqualTo(KtuRoundStatus.DRAFT)
        }

        @Test
        fun `should get single round by id`() {
            // Arrange
            val savedRound = roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2025",
                    year = 2025,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.DRAFT
                )
            )

            // Act
            val response = restClient(true)
                .getForEntity<KtuRound>("/ktu/rounds/${savedRound.id}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val round = response.body!!
            assertThat(round.id).isEqualTo(savedRound.id)
            assertThat(round.name).isEqualTo("KTU 2025")
        }

        @Test
        fun `should return 404 for non-existent round`() {
            // Act
            val response = restClient(true)
                .getForEntity<String>("/ktu/rounds/99999")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        }
    }

    @Nested
    inner class UpdateRound {
        @Test
        fun `should update round as admin`() {
            // Arrange
            val savedRound = roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2025",
                    year = 2025,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.DRAFT
                )
            )

            val updateRequest = UpdateKtuRound(
                name = "KTU 2025 - Oppdatert",
                openDate = LocalDate.of(2025, 3, 1),
                closeDate = LocalDate.of(2025, 4, 1)
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .putForEntity<KtuRound>("/ktu/rounds/${savedRound.id}", updateRequest)

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val round = response.body!!
            assertThat(round.name).isEqualTo("KTU 2025 - Oppdatert")
            assertThat(round.openDate).isEqualTo(LocalDate.of(2025, 3, 1))
        }

        @Test
        fun `should update round status`() {
            // Arrange
            val savedRound = roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2025",
                    year = 2025,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.DRAFT
                )
            )

            val updateRequest = UpdateKtuRound(
                status = KtuRoundStatus.OPEN
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .putForEntity<KtuRound>("/ktu/rounds/${savedRound.id}", updateRequest)

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            val round = response.body!!
            assertThat(round.status).isEqualTo(KtuRoundStatus.OPEN)
        }
    }

    @Nested
    inner class DeleteRound {
        @Test
        fun `should delete round as admin`() {
            // Arrange
            val savedRound = roundRepository.save(
                no.jpro.mypageapi.entity.ktu.KtuRound(
                    name = "KTU 2025",
                    year = 2025,
                    status = no.jpro.mypageapi.entity.ktu.KtuRoundStatus.DRAFT
                )
            )

            // Act
            val response = restClient(true, asAdmin = true)
                .delete<String>("/ktu/rounds/${savedRound.id}")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
            assertThat(roundRepository.findById(savedRound.id!!)).isEmpty
        }

        @Test
        fun `should return 404 when deleting non-existent round`() {
            // Act
            val response = restClient(true, asAdmin = true)
                .delete<String>("/ktu/rounds/99999")

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        }
    }
}
