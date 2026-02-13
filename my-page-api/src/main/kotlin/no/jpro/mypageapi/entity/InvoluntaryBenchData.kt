package no.jpro.mypageapi.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "involuntary_bench_data")
class InvoluntaryBenchData(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    val consultant: User,

    @Column(name = "month", nullable = false, length = 7)
    val month: String,

    @Column(name = "bench_weeks", nullable = false)
    val benchWeeks: Double,

    @Column(name = "is_imported", nullable = false)
    val isImported: Boolean = false

) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is InvoluntaryBenchData) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
