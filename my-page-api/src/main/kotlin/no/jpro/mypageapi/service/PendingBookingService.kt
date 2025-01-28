package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.PendingBookingRepository
import no.jpro.mypageapi.utils.mapper.PendingBookingMapper
import org.springframework.stereotype.Service
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoUnit

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

    val todayDateMinusSevenDays: LocalDate
        get() = LocalDate.now().minusDays(7)
    val cutOffDate: LocalDate
        get() = LocalDate.now().plusMonths(5)

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

    fun getDateListOfPendingBookingTrains(
        apartmentId: Long,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<List<LocalDate>> {
        val pendingBookings =
            pendingBookingRepository.findPendingBookingsByApartmentIdAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
                apartmentId,
                startDate,
                endDate
            )
        val pendingBookedDays = pendingBookings
            .flatMap { pendingBooking ->
                LongRange(0, ChronoUnit.DAYS.between(pendingBooking.startDate, pendingBooking.endDate))
                    .map { pendingBooking.startDate.plusDays(it) }
            }.distinct().sorted()

        return pendingBookedDays.groupBy { it.minusDays(pendingBookedDays.indexOf(it).toLong()) }
            .values.toList()
    }

    fun getAllDrawingPeriods(apartmentId: Long): List<DrawingPeriodDTO> {
        val pendingBookings = pendingBookingRepository
            .findPendingBookingsByApartmentIdAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
                apartmentId,
                todayDateMinusSevenDays,
                cutOffDate
            )
            .sortedBy { it.startDate }
        val drawPeriodList = mutableListOf<List<PendingBookingDTO>>()

        if (pendingBookings.isNotEmpty()) {
            var currentDrawPeriod = mutableListOf<PendingBookingDTO>()
            currentDrawPeriod.add(pendingBookings[0])

            for (i in 1 until pendingBookings.size) {
                if (pendingBookings[i].startDate < pendingBookings[i - 1].endDate && pendingBookings[i].startDate >= pendingBookings[i - 1].startDate) {
                    currentDrawPeriod.add(pendingBookings[i])
                } else {
                    drawPeriodList.add(currentDrawPeriod)
                    currentDrawPeriod = mutableListOf()
                    currentDrawPeriod.add(pendingBookings[i])
                }
            }
            drawPeriodList.add(currentDrawPeriod)
        }
        return drawPeriodList.map { pb ->
            val startDate = pb[0].startDate
            val endDate = pb[pb.size - 1].endDate
            val earliestCreatedDate = pb.minOfOrNull { it.createdDate }
            val drawingDate = earliestCreatedDate?.plusDays(7)?.takeIf { it.isBefore(pb[0].startDate) }

            DrawingPeriodDTO(
                startDate = startDate,
                endDate = endDate,
                drawingDate = drawingDate,
                pendingBookings = pb,
            )
        }
    }

    fun getPendingBookingInformationForApartment(apartmentId: Long): List<PendingBookingTrainDTO> {
        val pendingBookingTrainsDateList =
            getDateListOfPendingBookingTrains(apartmentId, todayDateMinusSevenDays, cutOffDate)

        val allDrawingPeriodDTO = getAllDrawingPeriods(apartmentId)

        return pendingBookingTrainsDateList.map { dates ->
            val startDate = dates.minOrNull()
            val endDate = dates.maxOrNull()

            val drawingPeriodDTO = allDrawingPeriodDTO.filter { drawingPeriod ->
                drawingPeriod.startDate in dates
            }

            val apartment = apartmentRepository.findApartmentById(apartmentId)

            PendingBookingTrainDTO(
                apartment = apartment,
                startDate = startDate!!,
                endDate = endDate!!,
                drawingPeriodList = drawingPeriodDTO
            )
        }
    }

    fun getPendingBookingInformation(): List<PendingBookingTrainDTO> {
        val apartments = apartmentRepository.findAll()

        val allTrainAndPendingBookings = apartments.flatMap { apartment ->
            getPendingBookingInformationForApartment(apartment.id!!)
        }
        return allTrainAndPendingBookings
    }

    fun getPendingBookingsBetweenDates(startDate: LocalDate, endDate: LocalDate, ): List<PendingBookingDTO> {
        val pendingBookings =
            pendingBookingRepository.findPendingBookingsByStartDateBetweenOrEndDateBetween(startDate, endDate, startDate, endDate)
        return pendingBookings.map { pendingBookingMapper.toPendingBookingDTO(it) }
    }

    fun getPendingBookingsRegisteredBeforeDate(cutoffDate: LocalDate): List<PendingBookingDTO> {
        val pendingBookings = pendingBookingRepository.findPendingBookingsByCreatedDateLessThanEqual(cutoffDate)
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
