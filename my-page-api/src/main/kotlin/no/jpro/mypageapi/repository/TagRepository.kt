package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Tag
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TagRepository : JpaRepository<Tag, Long> {
    fun findByName(name: String): Tag?
}