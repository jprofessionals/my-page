package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.YearlyConsultantCapacity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface YearlyConsultantCapacityRepository : JpaRepository<YearlyConsultantCapacity, Long> {

    fun findByYear(year: Int): YearlyConsultantCapacity?
}
