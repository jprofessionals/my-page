package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.UserDTO
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.utils.JwtUtils
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
        budgets = user.budgets.map { budgetPostMapper.toBudgetDTO(it) }
    )

    fun toUser(jwt: Jwt): User = User(
        sub = JwtUtils.getSub(jwt),
        email = JwtUtils.getEmail(jwt),
        name = JwtUtils.getName(jwt),
        givenName = JwtUtils.getGivenName(jwt),
        familyName = JwtUtils.getFamilyName(jwt),
        icon = JwtUtils.getIcon(jwt),
        budgets = listOf()
    )

}

