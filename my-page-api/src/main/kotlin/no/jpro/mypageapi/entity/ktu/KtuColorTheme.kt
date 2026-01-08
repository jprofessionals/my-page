package no.jpro.mypageapi.entity.ktu

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "ktu_color_theme")
data class KtuColorTheme(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, unique = true)
    val name: String,

    @Column(name = "header_bg_color", nullable = false)
    val headerBgColor: String,

    @Column(name = "primary_color", nullable = false)
    val primaryColor: String,

    @Column(name = "accent_bg_color", nullable = false)
    val accentBgColor: String,

    @Column(name = "is_default", nullable = false)
    val isDefault: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
