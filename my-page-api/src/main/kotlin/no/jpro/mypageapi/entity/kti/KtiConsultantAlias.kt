package no.jpro.mypageapi.entity.kti

import jakarta.persistence.*
import no.jpro.mypageapi.entity.User
import java.time.LocalDateTime

@Entity
@Table(name = "kti_consultant_alias")
data class KtiConsultantAlias(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "alias_name", nullable = false)
    val aliasName: String,

    // When user is null, this alias means "ignore/skip this consultant in imports"
    // Used for former employees who are no longer in the system
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    val user: User? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun isIgnored(): Boolean = user == null
}
