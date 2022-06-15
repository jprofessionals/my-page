package no.jpro.mypageapi.model

import javax.persistence.Entity
import javax.persistence.Id

@Entity
class User (
    @Id val id: String = "",
    val email: String = ""


)