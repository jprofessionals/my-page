package no.jpro.mypageapi.entity

import javax.persistence.Entity
import javax.persistence.Id
import javax.persistence.Table

@Entity
@Table(name="user")
data class User(
    @Id val id: String,
    val email: String?,
    val name: String?,
    val givenName: String?,
    val familyName: String?,
    val icon: String?
)
