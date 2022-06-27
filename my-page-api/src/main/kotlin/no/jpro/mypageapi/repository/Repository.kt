package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EmployeeRepository : JpaRepository<Employee, Long>

@Repository
interface UserRepository : JpaRepository<User,String>

@Repository
interface BudgetRepository : JpaRepository<Budget,Long>

@Repository
interface PostRepository : JpaRepository<Post,Long>

@Repository
interface BudgetCharacteristicRepository : JpaRepository<BudgetCharacteristics,Long>


