package no.jpro.mypageapi.dto

import net.minidev.json.annotate.JsonIgnore
import java.time.LocalDate
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id

class CreatePostDTO(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long,
    val date: LocalDate,
    val description: String?,
    val amount : Double,
    val expense: Boolean,
    val budgetId : Long
    )