package no.jpro.mypageapi.controller

import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.service.PostService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.validation.Valid

@RestController
@RequestMapping("post")
class PostController(private val postService: PostService) {
    @PostMapping("")
    fun createPost(@Valid @RequestBody createPostDTO: CreatePostDTO): PostDTO {
        return postService.createPost(createPostDTO)
    }
}