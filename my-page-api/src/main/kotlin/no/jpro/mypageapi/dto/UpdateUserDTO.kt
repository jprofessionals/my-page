package no.jpro.mypageapi.dto

import java.time.LocalDate

data class UpdateUserDTO(
    val nickName: String? = null,
    val startDate: LocalDate? = null
    )
