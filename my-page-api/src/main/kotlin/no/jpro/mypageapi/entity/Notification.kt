package no.jpro.mypageapi.entity

import jakarta.persistence.*

@Entity
@Table(name = "notification", uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "job_posting_id"])])
data class Notification(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val notificationTaskId: Long = 0,
    val userId: Long,
    var jobPostingId: Long,
    @Enumerated(EnumType.STRING)
    var status: Status = Status.CREATED
)