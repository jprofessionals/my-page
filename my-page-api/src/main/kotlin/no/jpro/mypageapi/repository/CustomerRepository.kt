package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Customer
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CustomerRepository : JpaRepository<Customer, Long> {
    fun findByName(name: String): Customer?
}