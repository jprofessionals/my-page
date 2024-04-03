package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.consumer.slack.SlackConsumer
import no.jpro.mypageapi.dto.ApartmentDTO
import no.jpro.mypageapi.dto.BookingDTO
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.UpdateBookingDTO
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.repository.SettingsRepository
import no.jpro.mypageapi.utils.mapper.ApartmentMapper
import no.jpro.mypageapi.utils.mapper.BookingMapper
import org.springframework.context.annotation.Lazy
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.*


@Service
class BookingService(
    private val bookingRepository: BookingRepository,
    private val bookingMapper: BookingMapper,
    private val apartmentRepository: ApartmentRepository,
    private val apartmentMapper: ApartmentMapper,
    private val settingsRepository: SettingsRepository,
    private val slackConsumer: SlackConsumer,
    @Lazy private val self : BookingService? // Lazy self injection for transactional metoder. Spring oppretter ikke transaksjoner hvis en @Transactional annotert metode blir kalt fra samme objekt
) {
    fun getCutoffDate(): LocalDate{
        val cutOffDateSetting = settingsRepository.findSettingBySettingId("CUTOFF_DATE_VACANCIES")
            ?: throw NullPointerException("Setting 'CUTOFF_DATE_VACANCIES' not set in database")
        return LocalDate.parse(cutOffDateSetting.settingValue, dateFormatter)
    }

    fun getBooking(bookingId: Long): Booking? {
        return bookingRepository.findBookingById(bookingId)
    }

    fun getBookings(employeeId: Int): List<BookingDTO> {
        val bookings = bookingRepository.findBookingByEmployeeId(employeeId)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getUserBookings(userSub: String): List<BookingDTO> {
        val bookings = bookingRepository.findBookingsByEmployeeSub(userSub)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getBookingsBetweenDates(startDate: LocalDate, endDate: LocalDate): List<BookingDTO> {
        val bookings =
            bookingRepository.findBookingsByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getBookingsOnDay(date: LocalDate): List<BookingDTO> {
        val bookings =
            bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(date, date)
        return bookings.map { bookingMapper.toBookingDTO(it) }
    }

    fun getAllVacanciesInAPeriod(startDate: LocalDate, endDate: LocalDate): Map<Long, List<LocalDate>> {
        val datesInRange = LongRange(0, ChronoUnit.DAYS.between(startDate, endDate))
            .map { startDate.plusDays(it) }
        val bookings = bookingRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(endDate, startDate)
        val bookedDays = bookings
            .flatMap { booking ->
                LongRange(0, ChronoUnit.DAYS.between(booking.startDate, booking.endDate))
                    .map { Pair(booking.apartment!!.id!!, booking.startDate.plusDays(it)) }
            }.groupBy { it.first }
            .mapValues { it.value.map { it.second }.toSet() }
        val apartmentVacancies = apartmentRepository.findAll()
            .map { it.id!! }
            .associateWith { apartmentId -> datesInRange.minus(bookedDays[apartmentId].orEmpty()) }

        return apartmentVacancies
    }

    fun getAllApartments(): List<ApartmentDTO> {
        val apartments = apartmentRepository.findAll()
        return apartments.map { apartmentMapper.toApartmentDTO(it) }
    }

    fun deleteBookingAndNotifySlack(bookingId: Long) {
        //kaller @Transactional metode på self for å sikre at transaksjon blir opprettet
        val deletedBooking = self?.findAndDeleteBooking(bookingId) ?: throw IllegalArgumentException("Error deleting booking with ID: $bookingId")
        val dagMåned = DateTimeFormatter.ofPattern("d. MMMM", Locale.Builder().setLanguage("nb").setRegion("NO").build())
        val cabinIsAvailableMsg =
            "${deletedBooking.apartment.cabin_name} er nå ledig fra ${deletedBooking.startDate.format(dagMåned)} til ${
                deletedBooking.endDate.format(dagMåned)
            }"
        slackConsumer.postMessageToChannel(cabinIsAvailableMsg)
    }

    @Transactional
    internal fun findAndDeleteBooking(bookingId: Long): Booking {
        val bookingToDelete = bookingRepository.findBookingById(bookingId) ?: throw IllegalArgumentException("Booking not found for ID: $bookingId")
        bookingRepository.deleteById(bookingId)
        return bookingToDelete
    }

    fun deleteBooking(bookingId: Long) {
        return bookingRepository.deleteById(bookingId)
    }

    fun getApartment(apartmentId: Long): Apartment {
        if(!apartmentRepository.existsApartmentById(apartmentId)){
            throw IllegalArgumentException("Apartment not found for ID: $apartmentId")
        }
        return apartmentRepository.findApartmentById(apartmentId)
    }

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    fun getOldBookingsWithinDates(wishStartDate: LocalDate, wishEndDate: LocalDate): List<Booking> {
        val query = entityManager.createQuery(
            "SELECT b FROM Booking b " +
                    "WHERE (:wishStartDate BETWEEN b.startDate AND b.endDate " +
                    "OR :wishEndDate BETWEEN b.startDate AND b.endDate) " +
                    "OR (b.startDate BETWEEN :wishStartDate AND :wishEndDate " +
                    "AND b.endDate BETWEEN :wishStartDate AND :wishEndDate)",
            Booking::class.java
        )
        query.setParameter("wishStartDate", wishStartDate)
        query.setParameter("wishEndDate", wishEndDate)
        return query.resultList
    }

    fun filterOverlappingBookings(apartmentId: Long, wishStartDate: LocalDate, wishEndDate: LocalDate): List<Booking> {
        val bookingsOverlappingWishedBooking = getOldBookingsWithinDates(wishStartDate, wishEndDate)

        val filteredBookings = bookingsOverlappingWishedBooking.filter { booking ->
            booking.apartment?.id == apartmentId &&
                    ((wishStartDate.isBefore(booking.endDate) && (wishEndDate.isAfter(booking.startDate))) ||
                            (wishStartDate.isBefore(booking.endDate) && (wishEndDate.isAfter(booking.endDate))) ||
                            (wishStartDate.isAfter(booking.startDate) && (wishEndDate.isBefore(booking.endDate))) ||
                            (wishStartDate.isBefore(booking.startDate) && (wishEndDate.isAfter(booking.endDate))))
        }
        return filteredBookings
    }

    val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    fun validateCutoffAndCreateBooking(bookingRequest: CreateBookingDTO, createdBy: User): BookingDTO {
        val cutOffDate = getCutoffDate()
        if(bookingRequest.endDate >= cutOffDate){
            throw IllegalArgumentException("Ikke mulig å opprette bookingen. Sluttdato må være før {${cutOffDate?.format(dateFormatter)}}")
        }
        return createBooking(bookingRequest, createdBy);
    }

    fun createBooking(bookingRequest: CreateBookingDTO, createdBy: User): BookingDTO {
        val apartment = getApartment(bookingRequest.apartmentID)
        val checkBookingAvailable = filterOverlappingBookings(bookingRequest.apartmentID,bookingRequest.startDate, bookingRequest.endDate)

        if (checkBookingAvailable.isNotEmpty()) {
            throw IllegalArgumentException("Ikke mulig å opprette bookingen. Eksisterer en annen booking i ønsket tidsperiode.")
        }

        val booking = bookingMapper.toBooking(
            bookingRequest,
            apartment
        ).copy(
            employee = createdBy
        )
        return bookingMapper.toBookingDTO(bookingRepository.save(booking))
    }

    fun filterOverlappingBookingsExcludingOwnBooking(apartmentId: Long, wishStartDate: LocalDate, wishEndDate: LocalDate, bookingToExclude: Booking?): List<Booking> {
        val filteredBookings = filterOverlappingBookings(apartmentId, wishStartDate, wishEndDate)
        return filteredBookings.filter { it.id != bookingToExclude?.id }
    }

    fun validateAndEditBooking(editPostRequest: UpdateBookingDTO, bookingToEdit: Booking): BookingDTO {
        val cutOffDate = getCutoffDate()

        if (editPostRequest.endDate <= cutOffDate) {
            return editBooking(editPostRequest, bookingToEdit)
        } else {
            throw IllegalArgumentException("Kan ikke endre bookingen til etter cutof.")
        }
    }

    fun editBooking(editPostRequest: UpdateBookingDTO, bookingToEdit: Booking): BookingDTO {
        val checkIfBookingUpdate = filterOverlappingBookingsExcludingOwnBooking(editPostRequest.apartmentId, editPostRequest.startDate, editPostRequest.endDate, bookingToEdit)

        val apartment = apartmentRepository.findApartmentById(editPostRequest.apartmentId)
        if (checkIfBookingUpdate.isEmpty() && editPostRequest.startDate.isBefore(editPostRequest.endDate)) {

            return bookingMapper.toBookingDTO(
                bookingRepository.save(
                    bookingToEdit.copy(
                        startDate = editPostRequest.startDate,
                        endDate = editPostRequest.endDate,
                        apartment = apartment
                    )
                )
            )
        } else {
            throw IllegalArgumentException("Kan ikke endre bookingen til disse datoene.")
        }
    }
}
