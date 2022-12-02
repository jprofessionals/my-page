package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.extensions.*
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service


@Service
class UserMapper(private val budgetPostMapper: BudgetPostMapper) {
    fun toUserDTO(user: User): UserDTO = UserDTO(
        email = user.email,
        name = user.name,
        givenName = user.givenName,
        familyName = user.familyName,
        icon = user.icon,
        nickName = user.nickName,
        startDate = user.startDate,
        budgets = user.budgets.map { budgetPostMapper.toBudgetDTO(it) },
        admin = user.admin
    )

    fun toUser(jwt: Jwt): User = User(
        sub = jwt.getSub(),
        email = jwt.getEmail(),
        name = jwt.getName(),
        givenName = jwt.getGivenName(),
        familyName = jwt.getFamilyName(),
        icon = jwt.getIcon(),
        budgets = listOf()
    )

}

