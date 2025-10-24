package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class CabinWishService(
    private val drawingRepository: CabinDrawingRepository,
    private val periodRepository: CabinPeriodRepository,
    private val wishRepository: CabinWishRepository,
    private val apartmentRepository: ApartmentRepository
) {
    
    @Transactional
    fun createWishes(drawingId: UUID, user: User, dto: BulkCreateWishesDTO): List<CabinWishDTO> {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }
        
        if (drawing.status != DrawingStatus.OPEN) {
            throw IllegalStateException("Cannot add wishes to a locked or completed drawing")
        }
        
        // Slett eksisterende ønsker for denne brukeren
        wishRepository.deleteByDrawingAndUser(drawing, user)
        
        // Opprett nye ønsker
        val wishes = dto.wishes.map { wishDto ->
            val period = periodRepository.findById(wishDto.periodId)
                .orElseThrow { IllegalArgumentException("Period not found: ${wishDto.periodId}") }
            
            val apartments = apartmentRepository.findAllById(wishDto.desiredApartmentIds)
            
            if (apartments.size != wishDto.desiredApartmentIds.size) {
                throw IllegalArgumentException("Some apartments not found")
            }
            
            CabinWish(
                drawing = drawing,
                user = user,
                period = period,
                priority = wishDto.priority,
                desiredApartments = apartments,
                comment = wishDto.comment
            )
        }
        
        val saved = wishRepository.saveAll(wishes)
        return saved.map { toDTO(it) }
    }
    
    fun getUserWishes(drawingId: UUID, userId: Long): List<CabinWishDTO> {
        return wishRepository.findByDrawingIdAndUserIdOrderByPriority(drawingId, userId)
            .map { toDTO(it) }
    }
    
    fun getAllWishes(drawingId: UUID): List<CabinWishDTO> {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }
        
        return wishRepository.findByDrawingOrderByPriority(drawing)
            .map { toDTO(it) }
    }
    
    private fun toDTO(wish: CabinWish): CabinWishDTO {
        return CabinWishDTO(
            id = wish.id,
            userId = wish.user.id!!,
            userName = wish.user.name ?: "Ukjent",
            userEmail = wish.user.email ?: "",
            periodId = wish.period.id!!,
            periodDescription = wish.period.description,
            priority = wish.priority,
            desiredApartmentIds = wish.desiredApartments.mapNotNull { it.id },
            desiredApartmentNames = wish.desiredApartments.mapNotNull { it.cabin_name },
            comment = wish.comment
        )
    }
}
