package no.jpro.mypageapi.extensions

import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.UserRepository
import org.springframework.security.oauth2.jwt.Jwt

fun Jwt.getEmail(): String {
    return getClaimAsString("email")
}
fun Jwt.getName(): String {
    return getClaimAsString("name")
}

fun Jwt.getFamilyName(): String {
    return getClaimAsString("family_name")
}

fun Jwt.getGivenName(): String {
    return getClaimAsString("given_name")
}

fun Jwt.getIcon(): String {
    return getClaimAsString("picture")
}

fun Jwt.getSub(): String {
    return getClaimAsString("sub")
}

fun Jwt.getUser(userRepository: UserRepository): User {
    val userSub = this.subject
    return userRepository.findUserBySub(userSub)
        ?: throw IllegalArgumentException("User not found: $userSub")
}