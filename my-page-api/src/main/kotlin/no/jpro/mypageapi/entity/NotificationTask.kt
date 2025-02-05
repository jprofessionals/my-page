package no.jpro.mypageapi.entity

import jakarta.persistence.*

@Entity
@Table(name = "notification_task")
data class NotificationTask(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    @Column(unique = true)
    var jobPostingId: Long,
    @Enumerated(EnumType.STRING)
    var status: Status = Status.CREATED
)

