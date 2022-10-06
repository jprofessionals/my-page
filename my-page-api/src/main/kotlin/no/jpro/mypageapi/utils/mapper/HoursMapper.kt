package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.CreateHoursDTO
import no.jpro.mypageapi.dto.HoursDTO
import no.jpro.mypageapi.entity.Hours
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.stereotype.Service

@Service
class HoursMapper(private val budgetRepository: BudgetRepository, private val userRepository: UserRepository, private val userMapper: UserMapper) {

    fun toHours(createHoursDTO: CreateHoursDTO, budgetId: Long, userSub: String): Hours {
        val budget = budgetRepository.findById(budgetId).get()
        val user = userRepository.findUserBySub(userSub)
        return Hours(
            hours = createHoursDTO.hoursUsed,
            budget = budget,
            createdBy = user?.name
        )
    }

    fun toHoursDTO(hours: Hours): HoursDTO {
        return HoursDTO(
            id = hours.id,
            hours = hours.hours,
            createdBy = hours.createdBy ?: ""
        )
    }
}