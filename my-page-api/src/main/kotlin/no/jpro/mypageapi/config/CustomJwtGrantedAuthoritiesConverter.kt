package no.jpro.mypageapi.config

import no.jpro.mypageapi.extensions.getSub
import org.springframework.core.convert.converter.Converter
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt

class CustomJwtGrantedAuthoritiesConverter(private val jdbcTemplate: JdbcTemplate) : Converter<Jwt, Collection<GrantedAuthority>> {

    override fun convert(source: Jwt): Collection<GrantedAuthority> {
        val userSub = source.getSub()
        val admin = try  {
            jdbcTemplate.queryForObject("SELECT admin from user where sub = ?", Boolean::class.java, userSub)
        } catch (noHits: EmptyResultDataAccessException) {
            return mutableListOf()
        }
        return if (admin!!) {
            mutableListOf(SimpleGrantedAuthority("ADMIN"), SimpleGrantedAuthority("USER"))
        } else {
            mutableListOf(SimpleGrantedAuthority("USER"))
        }
    }

}