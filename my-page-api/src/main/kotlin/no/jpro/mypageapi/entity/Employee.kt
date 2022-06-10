package no.jpro.mypageapi.entity

import javax.persistence.*


@Entity
class Employee(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var name: String = ""
)

