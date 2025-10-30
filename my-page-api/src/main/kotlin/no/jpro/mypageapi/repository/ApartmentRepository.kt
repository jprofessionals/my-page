package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Apartment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface ApartmentRepository : JpaRepository<Apartment, Long> {
    @Query("SELECT a FROM Apartment a ORDER BY a.sort_order ASC")
    override fun findAll(): List<Apartment>
    fun findApartmentById(apartmentId: Long): Apartment
    fun existsApartmentById(apartmentId: Long): Boolean
}