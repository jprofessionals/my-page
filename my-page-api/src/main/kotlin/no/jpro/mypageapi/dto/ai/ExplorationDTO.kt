package no.jpro.explorer

import kotlinx.serialization.Serializable

@Serializable
data class ExplorationDTO (val description: String, val imageUrl: String, val nextLocations : List<String>)

data class ExplorationRequest(val location: String, val artStyle: String, val sessionId: String)