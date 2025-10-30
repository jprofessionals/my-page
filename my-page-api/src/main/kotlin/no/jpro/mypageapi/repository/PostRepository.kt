package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Post
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PostRepository : JpaRepository<Post, Long> {
    fun findPostById(postId: Long): Post?
}