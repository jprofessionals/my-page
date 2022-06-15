package no.jpro.mypageapi.entity

import javax.persistence.Entity
import javax.persistence.Id
import javax.persistence.Table

@Entity
@Table(name="user_table")
class User (
    @Id val id: Long = 0,

    val email: String = ""


)