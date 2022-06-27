package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.stereotype.Service

@Service
class PostService(private val postRepository: PostRepository, private val budgetPostMapper: BudgetPostMapper) {

    fun createPost(createPostDTO: CreatePostDTO): PostDTO {
        val post = postRepository.save(budgetPostMapper.fromCreatePostDTOToPost(createPostDTO))
        return budgetPostMapper.fromPostToPostDTO(post)
    }
}