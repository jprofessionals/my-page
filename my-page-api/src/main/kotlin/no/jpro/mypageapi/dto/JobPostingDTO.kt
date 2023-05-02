package no.jpro.mypageapi.dto

import java.time.LocalDate

data class JobPostingDTO(
    val id: Long?,
    val title: String,
    val description: String?,
    val customer: String,
    val technologies: List<String>?,
    val location: String?,
    val dueDateForApplication: LocalDate?,
    val requiredYearsOfExperience: Int?,
)