package no.jpro.mypageapi.entity

import javax.persistence.Entity
import javax.persistence.Id
import javax.persistence.Table

@Entity
@Table(name="user")
data class User(
    @Id val id: String? =null,
    val email: String? =null,
    val name: String? =null,
    val givenName: String? = null,
    val familyName: String? = null,
    val icon: String? = null

)
