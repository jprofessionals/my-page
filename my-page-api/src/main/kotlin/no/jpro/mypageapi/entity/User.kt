package no.jpro.mypageapi.entity

import javax.persistence.Entity
import javax.persistence.Id
import javax.persistence.Table

@Entity
@Table(name="user_table")
data class User(
    @Id val id: String? =null,
    val email: String? =null,
    val name: String? =null
)
