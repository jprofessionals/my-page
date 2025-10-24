package no.jpro.mypageapi.service

import no.jpro.mypageapi.entity.*
import no.jpro.mypageapi.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for å konvertere cabin lottery allocations til faktiske bookings
 * når trekningen publiseres.
 */
@Service
class CabinBookingIntegrationService(
    private val drawingRepository: CabinDrawingRepository,
    private val allocationRepository: CabinAllocationRepository,
    private val bookingRepository: BookingRepository
) {
    private val logger = LoggerFactory.getLogger(CabinBookingIntegrationService::class.java)
    
    /**
     * Oppretter faktiske Booking-objekter for alle allocations i en publisert trekning.
     * Dette kalles automatisk når en trekning publiseres.
     */
    @Transactional
    fun createBookingsFromAllocations(drawingId: UUID) {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }
        
        if (drawing.status != DrawingStatus.PUBLISHED) {
            throw IllegalStateException("Can only create bookings from published drawings")
        }
        
        val allocations = allocationRepository.findByDrawingOrderByPeriodStartDateAscApartmentCabinNameAsc(drawing)
        
        logger.info("Creating ${allocations.size} bookings from drawing ${drawing.season}")
        
        val bookings = allocations.map { allocation ->
            // Sjekk om booking allerede finnes for denne perioden/apartment
            val existingBooking = bookingRepository.findBookingByStartDateAndEndDateAndApartmentId(
                allocation.period.startDate,
                allocation.period.endDate,
                allocation.apartment.id!!
            )
            
            if (existingBooking != null) {
                logger.warn("Booking already exists for ${allocation.apartment.cabin_name} " +
                        "from ${allocation.period.startDate} to ${allocation.period.endDate}")
                return@map null
            }
            
            Booking(
                startDate = allocation.period.startDate,
                endDate = allocation.period.endDate,
                apartment = allocation.apartment,
                employee = allocation.user
            )
        }.filterNotNull()
        
        if (bookings.isNotEmpty()) {
            bookingRepository.saveAll(bookings)
            logger.info("Successfully created ${bookings.size} bookings from lottery allocations")
        }
    }
    
    /**
     * Sletter alle bookings som ble opprettet fra en trekning.
     * Nyttig hvis man vil angre en publisering.
     */
    @Transactional
    fun deleteBookingsFromDrawing(drawingId: UUID) {
        val drawing = drawingRepository.findById(drawingId)
            .orElseThrow { IllegalArgumentException("Drawing not found: $drawingId") }
        
        val allocations = allocationRepository.findByDrawingOrderByPeriodStartDateAscApartmentCabinNameAsc(drawing)
        
        allocations.forEach { allocation ->
            val booking = bookingRepository.findBookingByStartDateAndEndDateAndApartmentId(
                allocation.period.startDate,
                allocation.period.endDate,
                allocation.apartment.id!!
            )
            
            if (booking != null && booking.employee?.id == allocation.user.id) {
                bookingRepository.delete(booking)
                logger.info("Deleted booking for ${allocation.user.name} - ${allocation.apartment.cabin_name}")
            }
        }
    }
}
