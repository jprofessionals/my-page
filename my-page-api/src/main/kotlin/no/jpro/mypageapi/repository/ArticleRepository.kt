package no.jpro.mypageapi.repository

import no.jpro.mypageapi.model.Employee
import no.jpro.mypageapi.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EmployeeRepository : JpaRepository<Employee, Long>

@Repository
interface UserRepository : JpaRepository<User,String>
