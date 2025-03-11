package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.PendingBookingRepository
import no.jpro.mypageapi.utils.mapper.PendingBookingMapper
import org.springframework.stereotype.Service
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters.previousOrSame
import java.util.*

@Service
class PendingBookingService(
    private val bookingService: BookingService,
    private val pendingBookingRepository: PendingBookingRepository,
    private val apartmentRepository: ApartmentRepository,
    private val pendingBookingMapper: PendingBookingMapper,
) {
    companion object {
        const val INCLUDES_WEDNESDAY_ERROR_MESSAGE = "En booking kan ikke inneholde en onsdag unntatt som start- eller sluttdato"
        const val TOO_LONG_ERROR_MESSAGE = "En booking kan ikke være lenger enn 7 dager"
        const val ALREADY_HAS_PENDING_BOOKING_MESSAGE_TEMPLATE = "%s har allerede et bookingønske på denne leiligheten i dette tidsrommet."
    }

    fun createPendingBooking(
        bookingRequest: CreatePendingBookingDTO,
        createdFor: User,
        creatorIsAdmin: Boolean
    ): PendingBookingDTO {
        if (createdFor.id == null) {
            throw IllegalArgumentException("Ikke mulig å opprette bookingen.")
        }
        if (ChronoUnit.DAYS.between(bookingRequest.startDate, bookingRequest.endDate) > 7) {
            throw IllegalArgumentException(TOO_LONG_ERROR_MESSAGE)
        }
        if (containsWednesdayExceptAsStartOrEnd(bookingRequest.startDate, bookingRequest.endDate)) {
            throw IllegalArgumentException(INCLUDES_WEDNESDAY_ERROR_MESSAGE)
        }

        val apartment = bookingService.getApartment(bookingRequest.apartmentID)
        val checkBookingAvailable = bookingService.filterOverlappingBookings(
            bookingRequest.apartmentID,
            bookingRequest.startDate,
            bookingRequest.endDate
        )
        if (checkBookingAvailable.isNotEmpty()) {
            throw IllegalArgumentException("Ønsket leilighet er ikke ledig i dette tidsrommet.")
        }

        val overlappingPendingBookings = pendingBookingRepository.findOverlappingPendingBookings(
            createdFor.id,
            bookingRequest.apartmentID,
            bookingRequest.startDate,
            bookingRequest.endDate,
            )
        val userAlreadyHasPendingBooking = overlappingPendingBookings.isNotEmpty()

        if (userAlreadyHasPendingBooking) {
            throw IllegalArgumentException(
                String.format(ALREADY_HAS_PENDING_BOOKING_MESSAGE_TEMPLATE, createdFor.name)
            )
        }

        val pendingBooking = pendingBookingMapper.toPendingBooking(
            bookingRequest,
            apartment
        ).copy(
            employee = createdFor
        )
        return pendingBookingMapper.toPendingBookingDTO(pendingBookingRepository.save(pendingBooking))

    }

    private fun containsWednesdayExceptAsStartOrEnd(startDate: LocalDate, endDate: LocalDate): Boolean {
        val startOffset = 1L
        val endOffset = ChronoUnit.DAYS.between(startDate, endDate) - 1
        return LongRange(startOffset, endOffset)
            .map { startDate.plusDays(it) }
            .any { it.dayOfWeek == DayOfWeek.WEDNESDAY }
    }

    private data class ApartmentWeek (val apartment: Apartment, val weekStartingWednesday: LocalDate)

    fun getPendingBookingInformation(): List<PendingBookingTrainDTO> {
        return getPendingBookingTrain().map { pbt ->
            PendingBookingTrainDTO(
                apartment = pbt.apartment,
                startDate = pbt.startDate,
                endDate = pbt.endDate,
                pendingBookings = pbt.pendingBookings.map { pb -> pendingBookingMapper.toPendingBookingDTO(pb) },
                drawingDate = pbt.drawingDate,
            )
        }
    }

    fun getPendingBookingTrain(): List<PendingBookingTrain> {
        val pendingBookings = pendingBookingRepository.findAll()
        return pendingBookings.groupBy {
            ApartmentWeek(it.apartment, it.startDate.with(previousOrSame(DayOfWeek.WEDNESDAY)))
        }.map { (apartmentWeek, pendingBookings) ->
            val earliestStartDate = pendingBookings.minOf { it.startDate }
            val earliestCreatedDate = pendingBookings.minOf { it.createdDate }
            val latestEndDate = pendingBookings.maxOf { it.endDate }
            PendingBookingTrain(
                apartment = apartmentWeek.apartment,
                startDate = earliestStartDate,
                endDate = latestEndDate,
                pendingBookings = pendingBookings,
                drawingDate = getDrawingDate(earliestCreatedDate, earliestStartDate),
            )
        }
    }

    fun getDrawingDate(earliestCreatedDate: LocalDate, earliestStartDate: LocalDate): LocalDate? {
        val daysBetween = ChronoUnit.DAYS.between(earliestCreatedDate, earliestStartDate)
        if (daysBetween < 4) {
            return null
        }
        val daysUntilDraw = Math.ceilDiv(daysBetween, 2)
        val drawingDate = if (daysUntilDraw < 7) {
            earliestCreatedDate.plusDays(daysUntilDraw)
        } else {
            earliestCreatedDate.plusDays(7)
        }
        return drawingDate
    }

    fun getPendingBookingsBetweenDates(startDate: LocalDate, endDate: LocalDate, ): List<PendingBookingDTO> {
        val pendingBookings =
            pendingBookingRepository.findPendingBookingsByStartDateBetweenOrEndDateBetween(startDate, endDate, startDate, endDate)
        return pendingBookings.map { pendingBookingMapper.toPendingBookingDTO(it) }
    }

    fun getUserPendingBookings(userSub: String): List<PendingBookingDTO> {
        val pendingBookings = pendingBookingRepository.findPendingBookingByEmployeeSub(userSub)
        return pendingBookings.map { pendingBookingMapper.toPendingBookingDTO(it) }
    }

    fun getPendingBooking(pendingBookingId: Long): PendingBooking? {
        return pendingBookingRepository.findPendingBookingById(pendingBookingId)
    }

    fun deletePendingBooking(pendingBookingId: Long) {
        return pendingBookingRepository.deleteById(pendingBookingId)
    }

    fun editPendingBooking(editBookingRequest: UpdateBookingDTO, bookingToEdit: PendingBooking) {
        val apartment = apartmentRepository.findApartmentById(editBookingRequest.apartmentID)
        //TODO: sjekk om det finnes en overlappende fastsatt booking
        val bookingToSave = PendingBooking(
            bookingToEdit.id,
            editBookingRequest.startDate,
            editBookingRequest.endDate,
            apartment,
            bookingToEdit.employee,
            createdDate = bookingToEdit.createdDate
        )
        pendingBookingRepository.save(bookingToSave)
    }
}

data class PendingBookingTrain(
    val id: String = UUID.randomUUID().toString(),
    val apartment: Apartment,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val drawingDate: LocalDate?,
    val pendingBookings: List<PendingBooking>,
)
