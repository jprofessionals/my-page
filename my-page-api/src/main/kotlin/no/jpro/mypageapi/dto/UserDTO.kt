package no.jpro.mypageapi.dto

import java.util.Date

class UserDTO(
    val email: String?,
    val name: String?,
    val givenName: String?,
    val familyName: String?,
    val icon: String?,
    var nickName: String? = null,
    var startDate: Date? = null

)
