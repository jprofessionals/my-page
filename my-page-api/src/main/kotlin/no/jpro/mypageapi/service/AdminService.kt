package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.repository.BudgetTypeRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.utils.mapper.BudgetTypeMapper
import no.jpro.mypageapi.utils.mapper.UserMapper
import org.springframework.stereotype.Service

@Service
class AdminService (
    private val userRepository: UserRepository,
    private val userMapper: UserMapper,
    private val budgetTypeRepository: BudgetTypeRepository,
    private val budgetTypeMapper: BudgetTypeMapper
) {
    fun getSummary() : UserTable {
        val userTable = UserTable()
        userTable.initialiseHeaders(budgetTypeRepository.findAll().map { budgetTypeMapper.toBudgetTypeDTO(it) })
        userRepository.findAll().forEach { userTable.addRowForUser(userMapper.toUserDTO(it)) }
        return userTable
    }
}