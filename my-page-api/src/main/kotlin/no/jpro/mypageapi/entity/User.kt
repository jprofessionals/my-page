package no.jpro.mypageapi.entity


import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import java.time.LocalDate

@Entity
@Table(name = "user")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val sub: String? = null,
    @Column(unique=true)
    val email: String?,
    val name: String?,
    val givenName: String?,
    val familyName: String?,
    val icon: String? = null,
    val nickName: String? = null,
    val startDate: LocalDate? = null,
    val employeeNumber: Int? = null,
    val admin: Boolean = false,
    @OneToMany(mappedBy = "user")
    val budgets: List<Budget>,
    val enabled: Boolean = true
)
