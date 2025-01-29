package no.jpro.mypageapi.entity

import jakarta.persistence.*

@Entity
@Table(name = "subscription", uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "tag"])])
data class Subscription(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val userId: Long,
    var tag: String
)