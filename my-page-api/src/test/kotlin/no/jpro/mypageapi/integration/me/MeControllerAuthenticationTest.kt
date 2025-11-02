package no.jpro.mypageapi.integration.me

import no.jpro.mypageapi.dto.BudgetDTO
import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.integration.IntegrationTestBase
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

/**
 * Integration tests for authentication flows in MeController
 * Tests both JWT authentication (production) and X-Test-User-Id header (development/test mode)
 *
 * Note: Inherits @ActiveProfiles("test") from IntegrationTestBase which enables X-Test-User-Id support
 */
@DisplayName("MeController Authentication")
class MeControllerAuthenticationTest : IntegrationTestBase() {

    @Nested
    @DisplayName("X-Test-User-Id header authentication (development mode)")
    inner class TestUserAuthenticationTests {

        @Test
        fun `should authenticate GET me with X-Test-User-Id header`() {
            // Act - Call /me endpoint with X-Test-User-Id header
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.email).isEqualTo(user.email)
        }

        @Test
        fun `should authenticate GET me budgets with X-Test-User-Id header`() {
            // Act
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/me/budgets",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<BudgetDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body).isInstanceOf(List::class.java)
        }

        @Test
        fun `should authenticate GET me bookings with X-Test-User-Id header`() {
            // Act
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/me/bookings",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body).isInstanceOf(List::class.java)
        }

        @Test
        fun `should authenticate GET me pendingBookings with X-Test-User-Id header`() {
            // Act
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/me/pendingBookings",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body).isInstanceOf(List::class.java)
        }

        @Test
        fun `should return 401 when neither JWT nor test user header provided`() {
            // Act - Call /me without any authentication
            val response = restClient(authenticated = false).exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        }

        @Test
        fun `should return 401 for budgets when unauthenticated`() {
            // Act
            val response = restClient(authenticated = false).exchange(
                "/me/budgets",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<BudgetDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        }

        @Test
        fun `should return 401 for bookings when unauthenticated`() {
            // Act
            val response = restClient(authenticated = false).exchange(
                "/me/bookings",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        }

        @Test
        fun `should return 401 for pendingBookings when unauthenticated`() {
            // Act
            val response = restClient(authenticated = false).exchange(
                "/me/pendingBookings",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        }
    }

    @Nested
    @DisplayName("JWT authentication (production mode)")
    inner class JwtAuthenticationTests {

        @Test
        fun `should authenticate GET me with JWT Bearer token`() {
            // Act - Use standard authenticated client (Bearer token)
            val response = restClient(authenticated = true).exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.email).isNotNull
        }

        @Test
        fun `should authenticate GET me budgets with JWT Bearer token`() {
            // Act
            val response = restClient(authenticated = true).exchange(
                "/me/budgets",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<BudgetDTO>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
        }

        @Test
        fun `should authenticate GET me bookings with JWT Bearer token`() {
            // Act
            val response = restClient(authenticated = true).exchange(
                "/me/bookings",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
        }

        @Test
        fun `should authenticate GET me pendingBookings with JWT Bearer token`() {
            // Act
            val response = restClient(authenticated = true).exchange(
                "/me/pendingBookings",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                object : ParameterizedTypeReference<List<Any>>() {}
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
        }
    }

    @Nested
    @DisplayName("Authentication precedence (development mode)")
    inner class AuthenticationPrecedenceTests {

        @Test
        fun `should use test user data when X-Test-User-Id header is provided`() {
            // Act - Get user info with X-Test-User-Id header
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert - Should return test user's data
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.email).isEqualTo(user.email)
            assertThat(response.body!!.name).isEqualTo(user.name)
        }

        @Test
        fun `should use different user data when different X-Test-User-Id is provided`() {
            // Act - Get admin user info with X-Test-User-Id header
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", adminUser.id.toString())

            val response = client.exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert - Should return admin user's data
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.email).isEqualTo(adminUser.email)
            assertThat(response.body!!.admin).isTrue()
        }

        @Test
        fun `should use JWT when no X-Test-User-Id header in development mode`() {
            // Act - Use JWT authentication (no X-Test-User-Id header)
            val response = restClient(authenticated = true).exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert - Should succeed with JWT
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.email).isNotNull
        }
    }

    @Nested
    @DisplayName("Admin flag visibility")
    inner class AdminFlagTests {

        @Test
        fun `should return admin true for admin users`() {
            // Act - Get admin user info
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", adminUser.id.toString())

            val response = client.exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.admin).isTrue()
            assertThat(response.body!!.email).isEqualTo(adminUser.email)
        }

        @Test
        fun `should return admin false for regular users`() {
            // Act - Get regular user info
            val client = restClient(authenticated = false)
            client.addHeaderForSingleHttpEntityCallback("X-Test-User-Id", user.id.toString())

            val response = client.exchange(
                "/me",
                HttpMethod.GET,
                HttpEntity.EMPTY,
                UserDTO::class.java
            )

            // Assert
            assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(response.body).isNotNull
            assertThat(response.body!!.admin).isFalse()
            assertThat(response.body!!.email).isEqualTo(user.email)
        }
    }
}