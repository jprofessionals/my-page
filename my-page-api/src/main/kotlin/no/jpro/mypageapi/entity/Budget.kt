package no.jpro.mypageapi.entity

import com.fasterxml.jackson.annotation.JsonManagedReference
import javax.persistence.*

@Entity
@Table()
data class Budget(
    @Id val id: Long,
    val userId: Long,
    val name: String,
    val budgetCharacteristicsId: Long,
    val ageOfBudgetInMonths: Long,
    @OneToMany(mappedBy = "budget")
    var posts: List<Post>

)