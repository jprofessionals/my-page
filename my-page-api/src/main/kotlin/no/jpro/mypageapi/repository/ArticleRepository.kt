package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Employee
import no.jpro.mypageapi.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface EmployeeRepository : JpaRepository<Employee, Long>

@Repository
interface UserRepository : JpaRepository<User,Long> {
    @Query( "SELECT m FROM User as m")
    fun getAllUsers(): List<User>
}
