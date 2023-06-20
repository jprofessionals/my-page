package no.jpro.mypageapi.utils

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.HttpTransport
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.JsonFactory
import com.google.api.client.json.gson.GsonFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.*

@Component
class GoogleJwtValidator(@Value("\${google.clientid}") clientId: String) {
    private val transport: HttpTransport = NetHttpTransport()
    private val jsonFactory: JsonFactory = GsonFactory()
    private val verifier = GoogleIdTokenVerifier.Builder(transport, jsonFactory).setAudience(Collections.singletonList(clientId)).build()

    fun isValidToken(token: String): Boolean {
        val idToken: GoogleIdToken = verifier.verify(token) ?: return false
        return (idToken.payload?.emailVerified == true && idToken.payload?.email?.endsWith("@jpro.no") == true)
    }
}