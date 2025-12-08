package no.jpro.mypageapi.dto

data class FlowcaseUserDTO(
    val id: String,
    val email: String?,
    val name: String?,
    val imageUrl: String?,
    val deactivated: Boolean = false
)
