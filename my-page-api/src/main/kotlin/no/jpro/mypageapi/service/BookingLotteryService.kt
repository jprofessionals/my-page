package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.integration.support.locks.LockRegistry
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import kotlin.random.Random

private const val LOTTERLY_LOCK_KEY = "BOOKING_LOTTERY"

@Service
class BookingLotteryService(
    private val bookingRepository: BookingRepository,
    private val userRepository: UserRepository,
    private val bookingService: BookingService,
    private val lockRegistry: LockRegistry
) {
    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private val logger = LoggerFactory.getLogger(BookingLotteryService::class.java)

    @Transactional
    fun pickWinnerPendingBooking(pendingBookingList: List<PendingBookingDTO>) {
        val lock = lockRegistry.obtain(LOTTERLY_LOCK_KEY)
        if (!lock.tryLock()) {
            throw IllegalStateException("Booking lottery is already running, please wait a moment and try again.")
        }
        try {
            if (pendingBookingList.size > 1) {
                val winner = pendingBookingList.random()
                val user = winner.employeeName?.let { userRepository.findUserByName(it) }

                winner.apartment?.let { CreateBookingDTO(it.id, winner.startDate, winner.endDate) }
                    ?.let {
                        if (user != null) {
                            bookingService.createBooking(it, user)
                        }
                    }
            } else {
                val winner = pendingBookingList[0]

                val user = winner.employeeName?.let { userRepository.findUserByName(it) }
                winner.apartment?.let { CreateBookingDTO(it.id, winner.startDate, winner.endDate) }
                    ?.let {
                        if (user != null) {
                            bookingService.createBooking(it, user)
                        }
                    }
            }
        } finally {
            lock.unlock()
        }
    }

    fun runPendingBookingsLottery() {
        logger.warn("Running pending bookings lottery")

        val lock = lockRegistry.obtain(LOTTERLY_LOCK_KEY)
        if (!lock.tryLock()) {
            return
        }
        try {
            runTheLottery(LocalDate.now().minusDays(7))
            //todo: send melding til vinnerne. Dette må gjøres utenfor transaksjonsgrensen for å være sikker på at bookingen er fastsatt før noen varsles
            //todo: send melding til alle tapere som overlapper med vinnerne
        } finally {
            lock.unlock()
        }
    }

    @Transactional
    internal fun runTheLottery(selectionDate: LocalDate) {

        //bruker en for-løkke for å unngå evig løkke selv om det skulle være noe galt med dataene i databasen
        for (i in 0..100) {
            val eldstePendingEldreEnn7DagerQuery = entityManager.createQuery(
                "SELECT p from PendingBooking p where createdDate <= :selectionDate AND startDate >= :today AND NOT EXISTS(\n" +
                        "    SELECT b FROM Booking b where b.apartment = p.apartment AND ( b.endDate >= p.startDate AND b.startDate <= p.endDate\n" +
                        "                               OR b.startDate <= p.endDate AND b.endDate >= p.startDate))" +
                        "ORDER BY createdDate ASC LIMIT 1", PendingBooking::class.java
            )
            eldstePendingEldreEnn7DagerQuery.setParameter("selectionDate", selectionDate)
            eldstePendingEldreEnn7DagerQuery.setParameter("today", LocalDate.now())
            val pendingEldreEnn7Dager = eldstePendingEldreEnn7DagerQuery.resultList
            if (pendingEldreEnn7Dager.isEmpty()) {
                return
            }
            //hent ut alle pending bookings for aktuell hytte som ikke overlapper med en fastsatt booking
            val pendingSomIkkeOverlapperMedFastsattQuery = entityManager.createQuery(
                "SELECT p from PendingBooking p where apartment= :apartment and id != :id and startDate >= :today and not exists(\n" +
                        "    SELECT b FROM Booking b where b.apartment = p.apartment AND ( b.endDate >= p.startDate AND b.startDate <= p.endDate\n" +
                        "                               OR b.startDate <= p.endDate AND b.endDate >= p.startDate))",
                PendingBooking::class.java
            )
            pendingSomIkkeOverlapperMedFastsattQuery.setParameter("today", LocalDate.now())
            pendingSomIkkeOverlapperMedFastsattQuery.setParameter("id", pendingEldreEnn7Dager[0].id)
            pendingSomIkkeOverlapperMedFastsattQuery.setParameter("apartment", pendingEldreEnn7Dager[0].apartment)
            val pendingSomIkkeOverlapperMedFastsatt = pendingSomIkkeOverlapperMedFastsattQuery.resultList

            val pendingForTrekk = mutableSetOf<PendingBooking>()
            pendingForTrekk.add(pendingEldreEnn7Dager[0])

            val tempList = mutableListOf<PendingBooking>()

            //plukk ut alle bookings som overlapper med en booking som allerede er plukket ut
            do {
                tempList.clear()
                for (pendingBooking in pendingSomIkkeOverlapperMedFastsatt) {
                    if (pendingForTrekk.any { pb -> pb.startDate <= pendingBooking.endDate && pb.endDate >= pendingBooking.startDate }) {
                        tempList.add(pendingBooking)
                    }
                }
                pendingForTrekk.addAll(tempList)
                pendingSomIkkeOverlapperMedFastsatt.removeAll(tempList)
            } while (tempList.isNotEmpty())

            //trekk en tilfeldig vinner
            val vinnendePendingBooking = pendingForTrekk.toList()[Random.Default.nextInt(0, pendingForTrekk.size)]

            //lag fastsatt booking for vinneren
            val vinnendeBooking = Booking(
                startDate = vinnendePendingBooking.startDate,
                endDate = vinnendePendingBooking.endDate,
                apartment = vinnendePendingBooking.apartment,
                employee = vinnendePendingBooking.employee
            )
            bookingRepository.save(vinnendeBooking)
        }
        logger.warn("Pending lottery did not terminate after 100 iterations. Something is probably wrong with the data in the database.")
    }
}