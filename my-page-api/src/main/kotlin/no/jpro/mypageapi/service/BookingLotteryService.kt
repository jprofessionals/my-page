package no.jpro.mypageapi.service

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
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.*

private const val LOTTERY_LOCK_KEY = "BOOKING_LOTTERY"

@Service
class BookingLotteryService(
    private val bookingRepository: BookingRepository,
    private val userRepository: UserRepository,
    private val bookingService: BookingService,
    private val lockRegistry: LockRegistry,
    private val slackService: SlackService,
    private val pendingBookingRepository: PendingBookingRepository,
    private val pendingBookingService: PendingBookingService,
    @Lazy private val self: BookingLotteryService? // Lazy self injection for transactional metoder. Spring oppretter ikke transaksjoner hvis en @Transactional annotert metode blir kalt fra samme objekt
) {
    private val logger = LoggerFactory.getLogger(BookingLotteryService::class.java)
    private val earliestDrawingTime = LocalTime.of(9, 0)
    private val latestDrawingTime = LocalTime.of(21, 0)

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

        val lock = lockRegistry.obtain(LOTTERY_LOCK_KEY)
        if (!lock.tryLock()) {
            throw IllegalStateException("Booking lottery is already running, please wait a moment and try again.")
        }
        try {
            if (pendingBookingList.size > 0) {
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
        if (self == null) {
            throw IllegalStateException("Lazy self injection failed, cannot run runPendingBookingsLottery")
        }
        val now = LocalTime.now()
        if (now.isBefore(earliestDrawingTime) || now.isAfter(latestDrawingTime)) {
            logger.info("Skipping lottery outside of configured hours $earliestDrawingTime - $latestDrawingTime")
            return
        }
        logger.info("Running pending bookings lottery")

        val lock = lockRegistry.obtain(LOTTERY_LOCK_KEY)
        if (!lock.tryLock()) {
            return
        }
        try {
            val resultMsg = self.runTheLottery()
            if (resultMsg != null) {
                slackService.postMessageToChannel(resultMsg)
            }

        } finally {
            lock.unlock()
        }
    }

    @Transactional
    internal fun runTheLottery(): String? {
        val vinnere = mutableSetOf<PendingBooking>()
        val tapere = mutableSetOf<PendingBooking>()

        pendingBookingService.getPendingBookingTrain()
            .filter { it.drawingDate != null && !LocalDate.now().isBefore(it.drawingDate) }
            .forEach { pendingBookingTrain ->
                val winner = pendingBookingTrain.pendingBookings.random()
                val winnerBooking = Booking(
                    startDate = winner.startDate,
                    endDate = winner.endDate,
                    apartment = winner.apartment,
                    employee = winner.employee,
                )
                bookingRepository.save(winnerBooking)

                vinnere.add(winner)
                tapere.addAll(pendingBookingTrain.pendingBookings.filter { it != winner })

                val pendingBookingIds = pendingBookingTrain.pendingBookings.map { pb -> pb.id }
                pendingBookingRepository.deleteAllById(pendingBookingIds)
            }

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
