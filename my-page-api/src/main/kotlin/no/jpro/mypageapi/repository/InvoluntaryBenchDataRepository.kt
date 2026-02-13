package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.InvoluntaryBenchData
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface InvoluntaryBenchDataRepository : JpaRepository<InvoluntaryBenchData, Long> {

    fun findByMonthBetweenOrderByMonth(startMonth: String, endMonth: String): List<InvoluntaryBenchData>

    fun findByConsultantIdAndMonth(consultantId: Long, month: String): InvoluntaryBenchData?
}
