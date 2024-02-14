package no.jpro.mypageapi.service

import no.jpro.mypageapi.consumer.slack.SlackConsumer
import no.jpro.mypageapi.repository.ApartmentRepository
import no.jpro.mypageapi.repository.BookingRepository
import org.springframework.stereotype.Component
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.*

@Component
class SlackNotificationService(
    val slackConsumer: SlackConsumer,
    val bookingRepository: BookingRepository,
    val apartmentRepository: ApartmentRepository
) {

    fun notifySlackChannelWithUpcomingBookings() {

        val periodStart= findPeriodStart();

        val dayMonthFormat =
            DateTimeFormatter.ofPattern("d. MMMM", Locale.Builder().setLanguage("nb").setRegion("NO").build())

        val upcomingBookings =
            bookingRepository.findBookingsByStartDateGreaterThanEqualAndStartDateLessThanEqual(periodStart, periodStart.plusDays(6))

        val notificationBuilder = StringBuilder()
        notificationBuilder.append("*Hyttereservasjoner neste periode:*\n")
        for (booking in upcomingBookings) {
            val bookingEier = slackConsumer.getUserToNotify(booking.employee)
            notificationBuilder.append(
                "$bookingEier har ${booking.apartment.cabin_name} fra ${
                    booking.startDate.format(
                        dayMonthFormat
                    )
                } til ${booking.startDate.format(dayMonthFormat)}\n"
            )
        }
        val allApartments = apartmentRepository.findAll();
        for (apartment in allApartments) {
            if (upcomingBookings.none { booking -> booking.apartment.id == apartment.id }) {
                notificationBuilder.append("*_${apartment.cabin_name} er ledig!_*\n")
            }
        }

        slackConsumer.postMessageToChannel(notificationBuilder.toString())
    }

    private fun findPeriodStart(): LocalDate {
      //return the date of wednesday of the current week
        val today = LocalDate.now()
        val dayOfWeek = today.dayOfWeek.value
        val daysToWednesday = 3 - dayOfWeek
        return today.plusDays(daysToWednesday.toLong())
    }
}