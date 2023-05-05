package no.jpro.explorer

data class ExplorationDTO (val description: String, val imageUrl: String, val nextLocations : List<String>)

data class ExplorationRequest(val location: String, val sessionId: String)