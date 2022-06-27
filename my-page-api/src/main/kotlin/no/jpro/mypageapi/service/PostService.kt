package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.repository.BudgetRepository
import no.jpro.mypageapi.repository.PostRepository
import no.jpro.mypageapi.utils.mapper.BudgetPostMapper
import org.springframework.stereotype.Service

@Service
class PostService(private val postRepository: PostRepository, private val budgetPostMapper: BudgetPostMapper,
private val budgetRepository: BudgetRepository) {

    fun createPost(createPostDTO: CreatePostDTO): PostDTO {
        var post = budgetPostMapper.fromCreatePostDTOToPost(createPostDTO)
        post.budget = budgetRepository.findById(createPostDTO.budgetId).get()
        postRepository.save(post)
        return budgetPostMapper.fromPostToPostDTO(post)
    }
}