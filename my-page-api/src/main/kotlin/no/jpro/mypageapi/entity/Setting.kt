package no.jpro.mypageapi.entity

import jakarta.persistence.*


@Entity
@Table(name = "settings")
data class Setting(
    @Id
    val settingId: String = "",
    val priority: Int = 0,
    val description: String = "",
    val settingValue: String = ""
)
