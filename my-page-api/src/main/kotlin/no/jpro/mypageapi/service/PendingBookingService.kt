package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.dto.*
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.PendingBookingRepository
import no.jpro.mypageapi.utils.mapper.PendingBookingMapper
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class PendingBookingService(
    private val bookingService: BookingService,
    private val pendingBookingRepository: PendingBookingRepository,
    private val apartmentRepository: ApartmentRepository,
    private val pendingBookingMapper: PendingBookingMapper,
) {
    @PersistenceContext
    private lateinit var entityManager: EntityManager

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

        val apartment = bookingService.getApartment(bookingRequest.apartmentID)
        val checkBookingAvailable = bookingService.filterOverlappingBookings(
            bookingRequest.apartmentID,
            bookingRequest.startDate,
            bookingRequest.endDate
        )
        if (checkBookingAvailable.isNotEmpty()) {
            throw IllegalArgumentException("Ønsket leilighet er ikke ledig i dette tidsrommet.")
        }

        val eksisterendePendingBookings = entityManager.createQuery(
            "SELECT p from PendingBooking p where p.apartment.id = :apartmentId AND p.employee = :user AND ( p.endDate > :startDate AND p.startDate < :endDate\n" +
                    "                               OR :startDate < p.endDate AND :endDate > p.startDate)",
            PendingBooking::class.java
        )
        eksisterendePendingBookings.setParameter("apartmentId", bookingRequest.apartmentID)
        eksisterendePendingBookings.setParameter("user", createdFor)
        eksisterendePendingBookings.setParameter("startDate", bookingRequest.startDate)
        eksisterendePendingBookings.setParameter("endDate", bookingRequest.endDate)
        val userAlreadyHasPendingBooking = eksisterendePendingBookings.resultList.isNotEmpty()

        if (userAlreadyHasPendingBooking) {
            throw IllegalArgumentException(
                if (creatorIsAdmin) createdFor.name else {
                    "Du"
                } + " har allerede et bookingønske på denne leiligheten i dette tidsrommet."
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

            DrawingPeriodDTO(
                startDate = startDate,
                endDate = endDate,
                pendingBookings = pb
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

    fun getPendingBookingInformation(): List<List<PendingBookingTrainDTO>> {
        val apartments = apartmentRepository.findAll()

        val allTrainAndPendingBookings = apartments.map { apartment ->
            getPendingBookingInformationForApartment(apartment.id)
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
        //TODO: sjekk om det finnes en overlappende fastsatt booking
        val bookingToSave = PendingBooking(
            bookingToEdit.id,
            editBookingRequest.startDate,
            editBookingRequest.endDate,
            bookingToEdit.apartment,
            bookingToEdit.employee,
            createdDate = bookingToEdit.createdDate
        )
        pendingBookingRepository.save(bookingToSave)
    }
}
