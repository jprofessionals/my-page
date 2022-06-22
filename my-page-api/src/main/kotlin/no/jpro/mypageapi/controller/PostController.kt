package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("post")
class PostController (private val postRepository: PostRepository, private val budgetPostMapper: BudgetPostMapper) {
    @PostMapping("")
    fun createPost(@RequestBody createPostDTO: CreatePostDTO): PostDTO {
        val post = postRepository.save(budgetPostMapper.fromCreatePostDTOToPost(createPostDTO))
        return budgetPostMapper.fromPostToPostDTO(post)
    }
}