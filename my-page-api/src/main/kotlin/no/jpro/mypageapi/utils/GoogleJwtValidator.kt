package no.jpro.mypageapi.utils

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.HttpTransport
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.JsonFactory
import com.google.api.client.json.gson.GsonFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import java.util.*

interface GoogleJwtValidator {
    fun isValidToken(token: String): Boolean
}

@Component
@Profile("local", "h2")
class GoogleJwtValidatorImpl(@Value("\${google.clientid}") clientId: String) : GoogleJwtValidator {
    private val transport: HttpTransport = NetHttpTransport()
    private val jsonFactory: JsonFactory = GsonFactory()
    private val verifier = GoogleIdTokenVerifier.Builder(transport, jsonFactory).setAudience(Collections.singletonList(clientId)).build()

    override fun isValidToken(token: String): Boolean {
        val idToken: GoogleIdToken = verifier.verify(token) ?: return false
        return (idToken.payload?.emailVerified == true && idToken.payload?.email?.endsWith("@jpro.no") == true)
    }
}

@Component
@Profile("gcp")
class GoogleJwtValidatorDummy : GoogleJwtValidator {
    override fun isValidToken(token: String): Boolean {
        //TODO: midlertidig validator intill vi får dette til å virke i GCP
        return true
    }
}