package no.jpro.mypageapi

import com.google.api.gax.core.CredentialsProvider
import com.google.cloud.spring.core.GcpProjectIdProvider
import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.config.SecretProviderMock
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.service.UserService
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.test.context.ActiveProfiles


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ExtendWith(MockitoExtension::class)
@Import(MockApplicationConfig::class) //Import @Beans used by Spring Boot at application startup
class MockExampleTests {

	@MockBean
	lateinit var jwtDecoder: JwtDecoder //Used by Spring Boot at application startup

	@MockBean
	lateinit var credentialsProvider: CredentialsProvider //Used by Spring Boot at application startup

	@MockBean
	lateinit var gcpProjectIdProvider: GcpProjectIdProvider //Used by Spring Boot at application startup


	/*
	 *  Mock tests starts here:
	 */

	@Test
	fun testMock() {
		//Create a mock instance of the UserService class. A mock will return null for all method calls, unless told otherwise
		val mock = Mockito.mock(UserService::class.java)

		//Mock returned value for UserService.checkIfUserExists(String userSub)
		Mockito.`when`(mock.checkIfUserExists("test1")).thenReturn(false)
		Mockito.`when`(mock.checkIfUserExists("test2")).thenReturn(true)

		//Verify that the provided mocks works as expected
		Assertions.assertFalse(mock.checkIfUserExists("test1"))
		Assertions.assertTrue(mock.checkIfUserExists("test2"))

		//Call UserService.getUserByEmail(String email). As this method is not mocked yet, it should return null
		var user = mock.getUserByEmail("test@invalid.org")

		//Verify that a not mocked method actually returns null
		Assertions.assertNull(user)

		//Create a real instance of the User class, and mock UserService.getUserByEmail to return this object for all calls
		val userMock = User(email="email", name="name", givenName="givenName", familyName="familyName", budgets=emptyList())
		Mockito.`when`(mock.getUserByEmail(Mockito.anyString())).thenReturn(userMock)

		//Call UserService.getUserByEmail(String email) as was done a few lines up. This method is now mocked, and should return the userMock object
		user = mock.getUserByEmail("test@invalid.org")
		Assertions.assertSame(userMock, user)
	}

	@Test
	fun testSpy() {
		//Unlike mock, a spy works on a real object. Create a real instance of SecretProvider interface (as implemented by SecretProviderMock)
		val secretProvider = SecretProviderMock()

		//Set up a spy for the real object. This spy object can be used to mock methods. Everything not mocked will act as a real object
		val spy = Mockito.spy(secretProvider)

		//Verify that spy acts as a real object. A mock would return, but spy should call real method (which for SecretProviderMock is hardcoded to return "mock")
		Assertions.assertEquals("mock", spy.getOpenAiApiKey())

		//Mock the spy to override the method and return "spy" instead of "mock"
		Mockito.`when`(spy.getOpenAiApiKey()).thenReturn("spy")

		//Verify that the mocked spy method is called instead of the real one
		Assertions.assertEquals("spy", spy.getOpenAiApiKey())
	}
}
