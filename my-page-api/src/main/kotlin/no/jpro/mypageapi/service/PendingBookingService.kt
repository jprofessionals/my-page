package no.jpro.mypageapi.service

import no.jpro.mypageapi.dto.CreatePendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.dto.PendingBookingTrainDTO
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
    private val pendingBookingMapper: PendingBookingMapper
    ) {

    val todayDate = LocalDate.now()
    val cutOffDate = LocalDate.now().plusMonths(5)

    fun createPendingBooking(bookingRequest: CreatePendingBookingDTO, createdBy: User): PendingBookingDTO {
        val apartment = bookingService.getApartment(bookingRequest.apartmentID)
        val checkBookingAvailable = bookingService.filterOverlappingBookings(bookingRequest.apartmentID,bookingRequest.startDate, bookingRequest.endDate)

        if(checkBookingAvailable.isEmpty()) {
            val pendingBooking = pendingBookingMapper.toPendingBooking(
                bookingRequest,
                apartment
            ).copy(
                employee = createdBy
            )
            return pendingBookingMapper.toPendingBookingDTO(pendingBookingRepository.save(pendingBooking))
        } else {
            throw IllegalArgumentException("Ikke mulig å opprette bookingen.")
        }
    }


    fun getDateListOfPendingBookingTrains(apartmentId: Long, startDate: LocalDate, endDate: LocalDate): List<List<LocalDate>>{
        val pendingBookings = pendingBookingRepository.findPendingBookingsByApartmentIdAndStartDateGreaterThanEqualAndEndDateLessThanEqual(apartmentId, startDate, endDate)
        val pendingBookedDays = pendingBookings
            .flatMap { pendingBooking ->
                LongRange(0, ChronoUnit.DAYS.between(pendingBooking.startDate, pendingBooking.endDate))
                    .map { pendingBooking.startDate.plusDays(it) }
            }.distinct().sorted()

        return pendingBookedDays.groupBy { it.minusDays(pendingBookedDays.indexOf(it).toLong()) }
            .values.toList()
    }


    fun getDatesForPendingBookingTrainOnSelectedDate(apartmentId: Long, selectedDate: LocalDate): List<LocalDate>? {
        val pendingBookingsDateListNoDuplicates = getDateListOfPendingBookingTrains(apartmentId, todayDate, cutOffDate)

        val pendingBookingTrain = pendingBookingsDateListNoDuplicates.find { currentList ->
            currentList.any { selectedDate == it }
        }
        return pendingBookingTrain
    }

    fun getPendingBookingsInTrain(apartmentId: Long, selectedDate: LocalDate): List<PendingBookingDTO> {
        val allPendingBookings = pendingBookingRepository.findPendingBookingsByApartmentIdAndStartDateGreaterThanEqualAndEndDateLessThanEqual(apartmentId, todayDate, cutOffDate)
        val datesInPendingBookingTrain = getDatesForPendingBookingTrainOnSelectedDate(apartmentId, selectedDate)

        return allPendingBookings.filter { booking ->
            datesInPendingBookingTrain?.any { it.isEqual(booking.startDate) } == true
        }
    }

    fun getPendingBookingsInTrainPeriod(apartmentId: Long): List<PendingBookingDTO> {
        val allPendingBookings = pendingBookingRepository.findPendingBookingsByApartmentIdAndStartDateGreaterThanEqualAndEndDateLessThanEqual(apartmentId, todayDate, cutOffDate)
        return allPendingBookings
    }

    fun getTrainAndPendingBookingsPeriod(apartmentId: Long): List<PendingBookingTrainDTO> {
        val pendingBookingTrainsDateList = getDateListOfPendingBookingTrains(apartmentId, todayDate, cutOffDate)
        val allPendingBookingsDTO = getPendingBookingsInTrainPeriod(apartmentId).sortedBy { it.startDate }

        return pendingBookingTrainsDateList.map { dates ->
            val startDate = dates.minOrNull()
            val endDate = dates.maxOrNull()

            val pendingBookingsInTrain = allPendingBookingsDTO.filter { booking ->
                booking.startDate in dates
            }

            val apartment = apartmentRepository.findApartmentById(apartmentId)

            PendingBookingTrainDTO(
                apartment = apartment,
                startDate = startDate!!,
                endDate = endDate!!,
                pendingBookingList = pendingBookingsInTrain
            )
        }
    }

    fun getTrainAndPendingBookingsPeriodAllApartment(): List<List<PendingBookingTrainDTO>> {
        val apartments = apartmentRepository.findAll()

        val allTrainAndPendingBookings = apartments.map { apartment ->
            getTrainAndPendingBookingsPeriod(apartment.id)
        }
        return allTrainAndPendingBookings
    }




}
