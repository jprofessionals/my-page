package no.jpro.mypageapi.utils.mapper

import no.jpro.mypageapi.dto.CreatePostDTO
import no.jpro.mypageapi.dto.PostDTO
import no.jpro.mypageapi.dto.UpdatePostDTO
import org.springframework.stereotype.Service
import no.jpro.mypageapi.model.CreatePost as CreatePostModel
import no.jpro.mypageapi.model.Post as PostModel
import no.jpro.mypageapi.model.UpdatePost as UpdatePostModel
import java.math.BigDecimal
import java.time.ZoneId

@Service
class PostMapper {

    fun toPostModel(postDTO: PostDTO): PostModel {
        return PostModel(
            id = postDTO.id ?: 0L,
            date = postDTO.date,
            description = postDTO.description,
            amountIncMva = postDTO.amountIncMva?.let { BigDecimal.valueOf(it) },
            amountExMva = postDTO.amountExMva?.let { BigDecimal.valueOf(it) },
            documentNumber = postDTO.documentNumber,
            dateOfPayment = postDTO.dateOfPayment,
            dateOfDeduction = postDTO.dateOfDeduction,
            expense = postDTO.expense,
            locked = postDTO.locked,
            createdDate = postDTO.createdDate?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            lastModifiedDate = postDTO.lastModifiedDate?.atZone(ZoneId.systemDefault())?.toOffsetDateTime(),
            createdBy = postDTO.createdBy
        )
    }

    fun toCreatePostDTO(createPost: CreatePostModel): CreatePostDTO {
        return CreatePostDTO(
            date = createPost.date,
            description = createPost.description,
            amountIncMva = createPost.amountIncMva.toDouble(),
            amountExMva = createPost.amountExMva.toDouble(),
            expense = createPost.expense
        )
    }

    fun toUpdatePostDTO(updatePost: UpdatePostModel): UpdatePostDTO {
        return UpdatePostDTO(
            date = updatePost.date,
            description = updatePost.description,
            amountExMva = updatePost.amountExMva?.toDouble()
        )
    }
}