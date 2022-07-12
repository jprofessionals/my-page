package no.jpro.mypageapi.entity


import java.time.LocalDate
import javax.persistence.*

@Entity
@Table(name = "user")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    val sub: String? = null,
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
    val budgets: List<Budget>
)
