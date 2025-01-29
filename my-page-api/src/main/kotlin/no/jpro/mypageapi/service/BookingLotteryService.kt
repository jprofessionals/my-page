package no.jpro.mypageapi.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import no.jpro.mypageapi.dto.CreateBookingDTO
import no.jpro.mypageapi.dto.PendingBookingDTO
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.PendingBooking
import no.jpro.mypageapi.repository.BookingRepository
import no.jpro.mypageapi.repository.PendingBookingRepository
import no.jpro.mypageapi.repository.UserRepository
import no.jpro.mypageapi.service.slack.SlackService
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.integration.support.locks.LockRegistry
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.*
import kotlin.random.Random

private const val LOTTERLY_LOCK_KEY = "BOOKING_LOTTERY"

@Service
class BookingLotteryService(
    private val bookingRepository: BookingRepository,
    private val userRepository: UserRepository,
    private val bookingService: BookingService,
    private val lockRegistry: LockRegistry,
    private val slackService: SlackService,
    private val pendingBookingRepository: PendingBookingRepository,
    @Lazy private val self: BookingLotteryService? // Lazy self injection for transactional metoder. Spring oppretter ikke transaksjoner hvis en @Transactional annotert metode blir kalt fra samme objekt
) {
    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private val logger = LoggerFactory.getLogger(BookingLotteryService::class.java)

    fun pickWinnerPendingBooking(pendingBookingList: List<PendingBookingDTO>) {
        if (self == null) {
            throw IllegalStateException("Lazy self injection failed, cannot run pickWinnerPendingBooking")
        }
        val resultMsg = self.runManualBookingLottery(pendingBookingList)
        if (resultMsg != null) {
            slackService.postMessageToChannel(resultMsg)
        }
    }

    @Transactional
    internal fun runManualBookingLottery(pendingBookingList: List<PendingBookingDTO>): String? {
        val winningBooking: PendingBookingDTO?

        val lock = lockRegistry.obtain(LOTTERLY_LOCK_KEY)
        if (!lock.tryLock()) {
            throw IllegalStateException("Booking lottery is already running, please wait a moment and try again.")
        }
        try {
            if (pendingBookingList.size > 1) {
                val winner = pendingBookingList.random()
                val user = winner.employeeName?.let { userRepository.findUserByName(it) }

                winner.apartment?.let { CreateBookingDTO(it.id!!, winner.startDate, winner.endDate) }
                    ?.let {
                        if (user != null) {
                            bookingService.validateCutoffAndCreateBooking(it, user)
                        }
                    }
                winningBooking = winner
            } else {
                val winner = pendingBookingList[0]

                val user = winner.employeeName?.let { userRepository.findUserByName(it) }
                winner.apartment?.let { CreateBookingDTO(it.id!!, winner.startDate, winner.endDate) }
                    ?.let {
                        if (user != null) {
                            bookingService.validateCutoffAndCreateBooking(it, user)
                        }
                    }
                winningBooking = winner
            }
        } finally {
            lock.unlock()
        }
        if (winningBooking == null) {
            return null
        }
        val winnerPendingBooking = pendingBookingRepository.findPendingBookingById(winningBooking.id!!)
        if (winnerPendingBooking == null) {
            return null
        }
        val loserPendingBookings = pendingBookingList.filter { it != winningBooking }
            .map { pendingBookingRepository.findPendingBookingById(it.id!!) }.filterNotNull().toSet()
        pendingBookingRepository.delete(winnerPendingBooking)
        pendingBookingRepository.deleteAll(loserPendingBookings)

        val resultMsg = formatResult(setOf(winnerPendingBooking), loserPendingBookings)
        return resultMsg
    }

    fun runPendingBookingsLottery() {
        logger.info("Running pending bookings lottery")
        if (self == null) {
            throw IllegalStateException("Lazy self injection failed, cannot run runPendingBookingsLottery")
        }

        val lock = lockRegistry.obtain(LOTTERLY_LOCK_KEY)
        if (!lock.tryLock()) {
            return
        }
        try {
            val resultMsg = self.runTheLottery(LocalDate.now().minusDays(7))
            if (resultMsg != null) {
                slackService.postMessageToChannel(resultMsg)
            }

        } finally {
            lock.unlock()
        }
    }

    @Transactional
    internal fun runTheLottery(selectionDate: LocalDate): String? {
        val vinnere = mutableSetOf<PendingBooking>()
        val tapere = mutableSetOf<PendingBooking>()

        //bruker en for-løkke for å unngå evig løkke selv om det skulle være noe galt med dataene i databasen
        for (i in 0..100) {
            val eldstePendingEldreEnn7DagerQuery = entityManager.createQuery(
                "SELECT p from PendingBooking p where createdDate <= :selectionDate AND startDate >= :today AND NOT EXISTS(\n" +
                        "    SELECT b FROM Booking b where b.apartment = p.apartment AND ( b.endDate > p.startDate AND b.startDate < p.endDate\n" +
                        "                               OR p.startDate < b.endDate AND p.endDate > b.startDate))" +
                        "ORDER BY createdDate ASC LIMIT 1", PendingBooking::class.java
            )
            eldstePendingEldreEnn7DagerQuery.setParameter("selectionDate", selectionDate)
            eldstePendingEldreEnn7DagerQuery.setParameter("today", LocalDate.now())
            val pendingEldreEnn7Dager = eldstePendingEldreEnn7DagerQuery.resultList
            if (pendingEldreEnn7Dager.isEmpty()) {
                return formatResult(vinnere.toSet(), tapere.toSet())
            }
            //hent ut alle pending bookings for aktuell hytte som ikke overlapper med en fastsatt booking
            val pendingSomIkkeOverlapperMedFastsattQuery = entityManager.createQuery(
                "SELECT p from PendingBooking p where apartment= :apartment and id != :id and startDate >= :today and not exists(\n" +
                        "    SELECT b FROM Booking b where b.apartment = p.apartment AND ( b.endDate > p.startDate AND b.startDate < p.endDate\n" +
                        "                               OR p.startDate < b.endDate AND p.endDate > b.startDate))",
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

            //legg til vinneren i vinner-listen og tapere i taper-listen
            vinnere.add(vinnendePendingBooking)
            for (pendingBooking in pendingForTrekk) {
                if (pendingBooking != vinnendePendingBooking &&
                    pendingBooking.startDate <= vinnendePendingBooking.endDate && pendingBooking.endDate >= vinnendePendingBooking.startDate
                ) {
                    tapere.add(pendingBooking)
                }
            }

            //lag fastsatt booking for vinneren
            val vinnendeBooking = Booking(
                startDate = vinnendePendingBooking.startDate,
                endDate = vinnendePendingBooking.endDate,
                apartment = vinnendePendingBooking.apartment,
                employee = vinnendePendingBooking.employee
            )
            bookingRepository.save(vinnendeBooking)
            pendingBookingRepository.delete(vinnendePendingBooking)
            pendingBookingRepository.deleteAll(tapere.toSet())
        }

        logger.warn("Pending lottery did not terminate after 100 iterations. Something is probably wrong with the data in the database.")
        return formatResult(vinnere.toSet(), tapere.toSet())
    }

    private fun formatResult(vinnere: Set<PendingBooking>, tapere: Set<PendingBooking>): String? {
        if (vinnere.isEmpty()) {
            return null
        }
        val dagMåned =
            DateTimeFormatter.ofPattern("d. MMMM", Locale.Builder().setLanguage("nb").setRegion("NO").build())
        val result = StringBuilder()

        result.append("*Hyttetrekning er gjennomført og følgende vinnere er trukket ut:*\n")
        for (vinner in vinnere) {
            result.append(
                slackService.getUserToNotify(vinner.employee) + " får " + vinner.apartment.cabin_name + " fra " + vinner.startDate.format(
                    dagMåned
                ) + " til " + vinner.endDate.format(dagMåned) + "\n"
            )
        }
        if (tapere.isEmpty()) {
            return result.toString()
        }
        result.append("\n*Følgende ønskede bookinger overlapper med vinnerne og er derfor tatt bort:*\n")
        for (taper in tapere) {
            result.append(
                slackService.getUserToNotify(taper.employee) + " ønsket " + taper.apartment.cabin_name + " fra " + taper.startDate.format(
                    dagMåned
                ) + " til " + taper.endDate.format(dagMåned) + "\n"
            )
        }
        return result.toString()
    }
}
